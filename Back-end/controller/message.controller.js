const { USER_MSG_TYPE, ASSISTANT_MSG_TYPE } = require('../constant/type/message.enum');
const { messageService, sessionService } = require('../service');
const { scheduleWeekService } = require('../service/schedule');
const groqService = require('../service/assistant/groq-service');
const { scheduleDate, scheduleAnalyzer } = require('../helper');

// Resolve the user's selected groups (validated against membership) and build the
// populated week data for each at the given date. Shared by chat + analysis so
// both ground the model in the same server-built schedule (never trust the
// client's copy of the schedule).
// Resolve which of the user's member groups are targeted (validated against
// membership). Empty selection means "all the user's groups".
const getMemberTargets = (user, groupIds) => {
    const memberGroups = (user.groups || [])
        .map((v) => v.group)
        .filter((g) => g && g._id);
    const wanted = (groupIds || []).map(String);
    return wanted.length
        ? memberGroups.filter((g) => wanted.includes(String(g._id)))
        : memberGroups;
};

const buildGroupsContext = async (user, groupIds, date) => {
    const targets = getMemberTargets(user, groupIds);
    const dateObj = date ? new Date(date) : new Date();
    const countWeek = scheduleDate.getISOWeekNumber(dateObj);

    const groups = await Promise.all(targets.map(async (g) => ({
        groupName: g.name,
        weekData: await scheduleWeekService.buildWeekDataByCountWeek(g._id, countWeek),
    })));

    return { groups, countWeek };
};

// Distinct ISO week numbers covered by [from, to] (inclusive), stepping by day so
// short ranges that cross a week boundary are handled. Capped to avoid abuse.
const isoWeeksInRange = (from, to) => {
    const start = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(start) || Number.isNaN(end) || end < start) {
        return [scheduleDate.getISOWeekNumber(start)];
    }
    const weeks = new Set();
    const cursor = new Date(start);
    let guard = 0;
    while (cursor <= end && guard < 400) {
        weeks.add(scheduleDate.getISOWeekNumber(cursor));
        cursor.setDate(cursor.getDate() + 1);
        guard += 1;
    }
    return [...weeks];
};

module.exports = {
    getConversation: async (req, res, next) => {
        try {
            const { message, groundData = {} } = req.body;
            const { authUser: user, session } = req;

            // Build schedule context server-side from the selected groups/date.
            const { groups } = await buildGroupsContext(
                user,
                groundData.groupIds,
                groundData.date
            );

            const promptData = {
                user: groundData.user,
                groups,
                selectedDay: groundData.selectedDay,
            };

            const messageUser = {
                userId: user._id,
                sessionId: session._id,
                type: USER_MSG_TYPE,
                content: message
            };

            const assistantReply = await groqService.getGroqResponse(message, promptData);

            const messageAssitent = {
                ...messageUser,
                type: ASSISTANT_MSG_TYPE,
                content: assistantReply
            };

            const messages = await messageService.createMessages([
                messageUser,
                messageAssitent
            ]);
            const messagesId = messages.map((vl) => vl._id);

            await sessionService.updateMessages(session._id, messagesId);

            res.status(200).json(messages);
        } catch (e) {
            next(e);
        }
    },

    // Run the deterministic analyzer over the selected groups' week, then have the
    // model explain the findings. Returns both the structured issues (for the UI)
    // and the natural-language reply.
    analyzeSchedule: async (req, res, next) => {
        try {
            const { authUser: user } = req;
            const {
                groupIds, date, dateFrom, dateTo, selectedDay, weekLabel
            } = req.body;

            const targets = getMemberTargets(user, groupIds);

            // Resolve the ISO weeks to scan: an explicit range, or a single week.
            const countWeeks = dateFrom
                ? isoWeeksInRange(dateFrom, dateTo || dateFrom)
                : [scheduleDate.getISOWeekNumber(new Date(date))];

            // Build a (group × week) matrix of populated week data, then analyze all.
            const groupWeeks = (await Promise.all(
                targets.flatMap((g) => countWeeks.map(async (cw) => ({
                    groupName: g.name,
                    weekData: await scheduleWeekService.buildWeekDataByCountWeek(g._id, cw),
                })))
            ));

            const issues = scheduleAnalyzer.detectIssuesForGroups(groupWeeks);
            const reply = await groqService.getGroqAnalysis(issues, { weekLabel, selectedDay });

            res.status(200).json({ issues, reply });
        } catch (e) {
            next(e);
        }
    },

    getMessages: async (req, res, next) => {
        try {
            const { authUser: user } = req;
            const messages = await messageService.findsMessages(user.id);

            res.json(messages);
            next();
        } catch (e) {
            next(e);
        }
    }
};
