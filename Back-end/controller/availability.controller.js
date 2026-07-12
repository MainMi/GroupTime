const { scheduleDate, scheduleAvailability } = require('../helper');
const { availabilityService } = require('../service/schedule');

module.exports = {
    // Common free slots across several of the requester's own group schedules.
    // A slot is free only when none of the selected groups has an event then.
    groupSlots: async (req, res, next) => {
        try {
            const { authUser: user } = req;
            const { groupIds, date } = req.body;

            const targets = availabilityService.resolveOwnTargets(user, groupIds);
            const countWeek = scheduleDate.getISOWeekNumber(new Date(date));

            const sources = await availabilityService.buildGroupSources(targets, countWeek);
            const { free, busy } = scheduleAvailability.computeFreeSlots(sources);

            res.status(200).json({
                free,
                busy,
                countWeek,
                groups: targets.map((g) => g.name),
            });
        } catch (e) {
            next(e);
        }
    },

    // A single member's availability across every group they belong to. Gated so
    // only a co-member may ask (see scheduleMiddleware.isTargetUserInGroup); only
    // busy/free times are returned, never what/where the other commitments are.
    memberSlots: async (req, res, next) => {
        try {
            const { userId, date } = req.body;
            const countWeek = scheduleDate.getISOWeekNumber(new Date(date));

            const sources = await availabilityService.buildMemberSources(userId, countWeek);
            const { free, busy } = scheduleAvailability.computeFreeSlots(sources);

            res.status(200).json({ free, busy, countWeek });
        } catch (e) {
            next(e);
        }
    },
};
