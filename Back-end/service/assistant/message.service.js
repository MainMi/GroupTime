const messageModel = require('../../model/message.model');
const { scheduleWeekService } = require('../schedule');
const { scheduleDate, magicAction, lang } = require('../../helper');
const ASSISTANT_TEXT = require('../../constant/assistantText');
const { MESSAGES_DEFAULT_LIMIT } = require('../../constant/message.enum');

const { resolveLanguage } = lang;

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

// Build the populated week data for each target group at one ISO week. `withId`
// includes the group id + name (needed to apply actions); otherwise just the
// name (enough to ground the chat). Always built server-side so the model never
// trusts the client's copy of the schedule.
const buildWeekContext = (targets, countWeek, { withId = false } = {}) => Promise.all(
    targets.map(async (g) => ({
        ...(withId ? { id: g._id, name: g.name } : { groupName: g.name }),
        weekData: await scheduleWeekService.buildWeekDataByCountWeek(g._id, countWeek),
    }))
);

// (group × week) matrix of populated week data for the deterministic analyzer.
// `countWeek` rides along so an issue can later be resolved against its own week.
const buildGroupWeekMatrix = (targets, countWeeks) => Promise.all(
    targets.flatMap((g) => countWeeks.map(async (cw) => ({
        groupName: g.name,
        countWeek: cw,
        weekData: await scheduleWeekService.buildWeekDataByCountWeek(g._id, cw),
    })))
);

// Drop actions targeting groups the user may not write to, explaining the skip.
// `allowedGroupIds` is the permitted subset computed by the permission middleware
// (userMiddleware.checkGroupParamRole with manyGroups).
const gateActions = (allowedGroupIds, { actions = [], reply }, langCode) => {
    const allowed = [];
    const denied = [];
    for (const a of actions) {
        (allowedGroupIds.has(String(a.groupId)) ? allowed : denied).push(a);
    }
    if (!denied.length) return { actions: allowed, reply };

    const names = [...new Set(denied.map((a) => a.groupName))].map((n) => `«${n}»`).join(', ');
    const note = ASSISTANT_TEXT.permissionSkip[resolveLanguage(langCode)](names);
    return { actions: allowed, reply: allowed.length ? `${reply}\n\n${note}` : note };
};

// Turn the model's "/organize" tag suggestions into confirmable edit actions with
// tag-focused summaries, plus a fallback reply. (Resolution + localized text only;
// permission gating stays with gateActions, persistence with the controller.)
const buildOrganizeProposal = (parsed, groups, langCode) => {
    const lng = resolveLanguage(langCode);

    const entries = (Array.isArray(parsed?.actions) ? parsed.actions : [])
        .filter((a) => a && a.targetEventName && Array.isArray(a.tags) && a.tags.length)
        .map((a) => ({
            intent: 'edit',
            groupName: a.groupName,
            targetEventName: a.targetEventName,
            event: { tag: [...new Set(a.tags.map((t) => String(t).trim()).filter(Boolean))] },
        }));

    const resolved = magicAction.resolveMagicActions({ actions: entries }, groups, langCode);

    // Rewrite each summary to focus on the tags being added (clearer than the
    // generic edit summary for a tag-only change).
    resolved.actions = resolved.actions.map((a) => {
        const tags = (a.event?.tag || []).join(', ');
        const summary = ASSISTANT_TEXT.organizeTagSummary[lng](tags, a.event?.name, a.groupName);
        return { ...a, summary };
    });

    const fallbackReply = resolved.actions.length
        ? ASSISTANT_TEXT.organizeIntro[lng]
        : ASSISTANT_TEXT.organizeNoTags[lng];

    return { resolved, fallbackReply };
};

// Turn the analyzer's deterministic "shiftTime" suggestions into confirmable,
// permission-gated edit actions. Each fix is resolved against the SAME ISO week
// its issue came from (a range may span several weeks), so the target event is
// always found in that week's data instead of guessing a single week.
const buildAnalysisFixActions = async (targets, issues, allowedGroupIds, langCode) => {
    const byWeek = new Map();
    for (const it of (issues || [])) {
        if (it.suggestion?.action === 'shiftTime' && it.countWeek != null) {
            const entries = byWeek.get(it.countWeek) || byWeek.set(it.countWeek, []).get(it.countWeek);
            entries.push({
                intent: 'edit',
                groupName: it.groupName,
                targetEventName: it.suggestion.event,
                event: { time: it.suggestion.newTime },
            });
        }
    }
    if (!byWeek.size) return [];

    const perWeek = await Promise.all(
        [...byWeek.keys()].map(async (countWeek) => {
            const groups = await buildWeekContext(targets, countWeek, { withId: true });
            const entries = byWeek.get(countWeek);
            return magicAction.resolveMagicActions({ actions: entries }, groups, langCode).actions;
        })
    );
    return gateActions(allowedGroupIds, { actions: perWeek.flat() }, langCode).actions;
};

// ISO week number for an optional date, defaulting to "now". Small convenience so
// the assistant handlers don't all repeat the new Date(...) dance.
const weekFor = (date) => scheduleDate.getISOWeekNumber(date ? new Date(date) : new Date());

module.exports = {
    createMessage: (data) => messageModel.create(data),
    createMessages: (data) => messageModel.insertMany(data),
    updateMessage: (queryData, newData) => messageModel
        .findOneAndUpdate(queryData, { $set: newData }),
    findMessage: (data) => messageModel.findOne(data).lean(),
    findsMessages: (userId, limit = MESSAGES_DEFAULT_LIMIT, page = 1) => messageModel.find({ userId })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ timestamp: -1 }),
    deleteMessage: (queryData) => messageModel.findOneAndDelete(queryData),
    deleteMessages: (queryData) => messageModel.deleteMany(queryData),

    getMemberTargets,
    buildWeekContext,
    buildGroupWeekMatrix,
    gateActions,
    buildOrganizeProposal,
    buildAnalysisFixActions,
    weekFor,
};
