const scheduleWeekService = require('./scheduleWeek.service');
const verificateService = require('../verificate.service');
const { VERIFIED_TYPE } = require('../../constant/type/verificateToken.enum');

// Resolve which of the user's own member groups are targeted (validated against
// membership). Empty selection means "all the user's groups". Mirrors
// messageService.getMemberTargets but kept local to avoid a schedule↔assistant
// require cycle.
const resolveOwnTargets = (user, groupIds) => {
    const memberGroups = (user.groups || [])
        .map((v) => v.group)
        .filter((g) => g && g._id);
    const wanted = (groupIds || []).map(String);
    return wanted.length
        ? memberGroups.filter((g) => wanted.includes(String(g._id)))
        : memberGroups;
};

// Build [{ label, weekData }] sources for a set of group targets at one ISO week.
// The group name rides along as the label so the UI can show which group occupies
// a busy slot (these are the requester's own groups, so names are fine to reveal).
const buildGroupSources = (targets, countWeek) => Promise.all(
    targets.map(async (g) => ({
        label: g.name,
        weekData: await scheduleWeekService.buildWeekDataByCountWeek(g._id, countWeek),
    }))
);

// Build sources for a single member across every group they belong to. Labels are
// intentionally omitted — a co-member should only learn the member's busy/free
// times, never what/where those other commitments are.
const buildMemberSources = async (userId, countWeek) => {
    const memberships = await verificateService.findVerificateUsers({
        user: userId,
        type: VERIFIED_TYPE,
    });
    const groupIds = [...new Set(memberships.map((m) => String(m.group)).filter(Boolean))];
    return Promise.all(groupIds.map(async (groupId) => ({
        weekData: await scheduleWeekService.buildWeekDataByCountWeek(groupId, countWeek),
    })));
};

module.exports = {
    resolveOwnTargets,
    buildGroupSources,
    buildMemberSources,
};
