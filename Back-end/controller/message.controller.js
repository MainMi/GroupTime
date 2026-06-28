const { USER_MSG_TYPE, ASSISTANT_MSG_TYPE } = require('../constant/type/message.enum');
const { messageService, sessionService } = require('../service');
const groqService = require('../service/assistant/groq.service');
const { scheduleDate, scheduleAnalyzer, magicAction } = require('../helper');

module.exports = {
    getConversation: async (req, res, next) => {
        try {
            const { message, groundData = {} } = req.body;
            const { authUser: user, session } = req;

            // Build schedule context server-side from the selected groups/date.
            const targets = messageService.getMemberTargets(user, groundData.groupIds);
            const groups = await messageService.buildWeekContext(
                targets,
                messageService.weekFor(groundData.date)
            );

            const promptData = {
                user: groundData.user,
                groups,
                selectedDay: groundData.selectedDay,
                lang: groundData.lang,
                history: groundData.history,
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
                groupIds, date, dateFrom, dateTo, selectedDay, weekLabel, lang
            } = req.body;

            const targets = messageService.getMemberTargets(user, groupIds);

            // Resolve the ISO weeks to scan: an explicit range, or a single week.
            const countWeeks = dateFrom
                ? scheduleDate.isoWeeksInRange(dateFrom, dateTo || dateFrom)
                : [scheduleDate.getISOWeekNumber(new Date(date))];

            // Build a (group × week) matrix of populated week data, then analyze all.
            const groupWeeks = await messageService.buildGroupWeekMatrix(targets, countWeeks);

            const issues = scheduleAnalyzer.dedupeIssues(
                scheduleAnalyzer.detectIssuesForGroups(groupWeeks)
            );

            // Turn deterministic, appliable suggestions (e.g. overlap → shift time) into
            // confirmable, permission-gated edit actions (resolved per source week).
            const actions = await messageService.buildAnalysisFixActions(
                targets, issues, req.allowedGroupIds, lang
            );

            const reply = await groqService.getGroqAnalysis(issues, { weekLabel, selectedDay, lang });

            res.status(200).json({ issues, reply, actions });
        } catch (e) {
            next(e);
        }
    },

    // "/magic": parse a create/edit request into a structured action the client
    // confirms and applies via the existing event endpoints. The conversation is
    // persisted; the action payload is returned live only (never persisted).
    magic: async (req, res, next) => {
        try {
            const { message, groundData = {} } = req.body;
            const { authUser: user, session } = req;

            const targets = messageService.getMemberTargets(user, groundData.groupIds);
            const groups = await messageService.buildWeekContext(
                targets,
                messageService.weekFor(groundData.date),
                { withId: true }
            );

            const cleaned = String(message).replace(/^\s*\/magic\b/i, '').trim();

            const parsed = await groqService.getGroqMagic(cleaned, {
                user: groundData.user,
                groups,
                lang: groundData.lang,
                history: groundData.history,
            });

            const resolved = magicAction.resolveMagicActions(parsed, groups, groundData.lang);
            const { actions, reply } = messageService.gateActions(req.allowedGroupIds, resolved, groundData.lang);

            const created = await messageService.createMessages([
                { userId: user._id, sessionId: session._id, type: USER_MSG_TYPE, content: message },
                { userId: user._id, sessionId: session._id, type: ASSISTANT_MSG_TYPE, content: reply },
            ]);
            await sessionService.updateMessages(session._id, created.map((v) => v._id));

            res.status(200).json({ messages: created, actions });
        } catch (e) {
            next(e);
        }
    },

    // "/organizer": propose relevant tags for the selected groups' events. Each
    // proposal becomes a confirmable edit (set tags), gated like /magic.
    organize: async (req, res, next) => {
        try {
            const { message, groundData = {} } = req.body;
            const { authUser: user, session } = req;

            const targets = messageService.getMemberTargets(user, groundData.groupIds);
            const groups = await messageService.buildWeekContext(
                targets,
                messageService.weekFor(groundData.date),
                { withId: true }
            );

            const parsed = await groqService.getGroqOrganize({ groups, lang: groundData.lang });
            const { resolved, fallbackReply } = messageService.buildOrganizeProposal(parsed, groups, groundData.lang);

            const { actions, reply } = messageService.gateActions(
                req.allowedGroupIds,
                { actions: resolved.actions, reply: parsed?.reply || fallbackReply },
                groundData.lang
            );

            const created = await messageService.createMessages([
                { userId: user._id, sessionId: session._id, type: USER_MSG_TYPE, content: message },
                { userId: user._id, sessionId: session._id, type: ASSISTANT_MSG_TYPE, content: reply },
            ]);
            await sessionService.updateMessages(session._id, created.map((v) => v._id));

            res.status(200).json({ messages: created, actions });
        } catch (e) {
            next(e);
        }
    },

    getMessages: async (req, res, next) => {
        try {
            const { authUser: user } = req;
            const messages = await messageService.findsMessages(user.id);

            res.json(messages.reverse());
            next();
        } catch (e) {
            next(e);
        }
    },

    // Persist client-built messages (e.g. the localized analysis result) so they
    // survive a reload. Scoped to the authed user + their session.
    persistMessages: async (req, res, next) => {
        try {
            const { authUser: user, session } = req;
            const validTypes = new Set([USER_MSG_TYPE, ASSISTANT_MSG_TYPE]);

            const docs = (Array.isArray(req.body.messages) ? req.body.messages : [])
                .filter((m) => m && validTypes.has(m.type) && typeof m.content === 'string' && m.content.trim())
                .map((m) => ({
                    userId: user._id,
                    sessionId: session._id,
                    type: m.type,
                    content: m.content,
                }));

            if (!docs.length) {
                res.status(400).json({ message: 'No valid messages to persist' });
                return;
            }

            const created = await messageService.createMessages(docs);
            await sessionService.updateMessages(session._id, created.map((v) => v._id));

            res.status(200).json(created);
        } catch (e) {
            next(e);
        }
    }
};
