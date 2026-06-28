const scheduleDate = require('../helper/scheduleDate.helper');
const {
    scheduleWeekService,
    eventDateService,
    eventInfoService
} = require('../service/schedule');

module.exports = {
    swapScheduleWeeks: async (req, res, next) => {
        try {
            const { dynamicWeeks: weeks, swapIndexes } = req;

            // Order the indices so the lower one is always slotted first. `let`
            // (not the previous const) is required — they get swapped in place.
            let [weekIdx1, weekIdx2] = swapIndexes;
            if (weekIdx1 > weekIdx2) {
                [weekIdx1, weekIdx2] = [weekIdx2, weekIdx1];
            }

            weeks[weekIdx1].updatedAt = weeks.length === weekIdx2
                ? new Date()
                : scheduleDate.calculateMiddleTimestamp(
                    weeks[weekIdx1].updatedAtManual,
                    weeks[weekIdx2 + 1].updatedAtManual
                );

            await weeks[weekIdx1].save();
            res.json('Weeks swapped');
        } catch (e) {
            next(e);
        }
    },

    // scheduleWeek.controller.js

    getSchedule: async (req, res, next) => {
        try {
            const { date, groupId } = req.body;

            const dateObj = new Date(date);

            const countWeek = scheduleDate.getISOWeekNumber(dateObj);

            const staticWeeksCount = await scheduleWeekService.countStaticWeeks(groupId);
            let staticWeek = null;

            if (staticWeeksCount > 0) {
                const staticWeekIndex = countWeek % staticWeeksCount;
                staticWeek = await scheduleWeekService.findStaticWeekByIndex(groupId, staticWeekIndex);
            }

            const dynamicWeek = await scheduleWeekService.findDynamicWeekByCountWeek(groupId, countWeek);

            const result = {};

            if (staticWeek && staticWeek.schedule.some((day) => day.events.length > 0)) {
                result.staticWeek = staticWeek.schedule;
            }

            if (dynamicWeek && dynamicWeek.schedule.some((day) => day.events.length > 0)) {
                result.dynamicWeek = dynamicWeek.schedule;
            }

            // Cache version: newest updatedAt across the resolved week docs. The
            // client stores this and uses /week/version to detect changes without
            // re-downloading the full week.
            const version = Math.max(
                staticWeek?.updatedAt ? new Date(staticWeek.updatedAt).getTime() : 0,
                dynamicWeek?.updatedAt ? new Date(dynamicWeek.updatedAt).getTime() : 0
            );

            res.json({
                ...result, staticWeeksCount, countWeek, version
            });
        } catch (e) {
            next(e);
        }
    },

    // Lightweight change-detection endpoint: returns just the cache version for a
    // group's week so the client can decide whether to reuse its cached copy.
    getScheduleVersion: async (req, res, next) => {
        try {
            const { date, groupId } = req.body;
            const countWeek = scheduleDate.getISOWeekNumber(new Date(date));
            const version = await scheduleWeekService.getWeekVersionByCountWeek(groupId, countWeek);
            res.json({ version, countWeek });
        } catch (e) {
            next(e);
        }
    },

    addStaticWeek: async (req, res, next) => {
        try {
            const { groupId } = req.body;
            const staticWeeks = await scheduleWeekService.findAllStaticWeeks(groupId);

            const maxCountWeek = staticWeeks.length > 0
                ? staticWeeks.reduce((max, week) => {
                    const currentCount = typeof week.countWeek === 'number' ? week.countWeek : -1;
                    return Math.max(max, currentCount);
                }, -1)
                : -1;

            await scheduleWeekService.createStaticWeek(groupId, maxCountWeek + 1);

            res.json('Created!');
        } catch (e) {
            next(e);
        }
    },

    addDynamicWeek: async (req, res, next) => {
        try {
            const { groupId, date } = req.body;

            const dateObj = new Date(date);

            const countWeek = scheduleDate.getISOWeekNumber(dateObj);

            await scheduleWeekService.createDynamicWeek(groupId, countWeek);

            res.json('Created!');
        } catch (e) {
            next(e);
        }
    },

    getAllStaticWeeks: async (req, res, next) => {
        try {
            const { groupId } = req.body;
            const staticWeeks = await scheduleWeekService.findAllStaticWeeks(groupId);
            res.json(staticWeeks.map((w) => ({ _id: w._id, countWeek: w.countWeek })));
        } catch (e) {
            next(e);
        }
    },

    deleteWeek: async (req, res, next) => {
        try {
            const scheduleWeek = req.week;
            const { groupId } = req.body;
            const removeEventDate = [];
            const removeEventInfo = [];

            for (const day of scheduleWeek.schedule) {
                for (const event of (day.events || [])) {
                    if (event.eventDate) removeEventDate.push(event.eventDate._id || event.eventDate);
                    if (event.eventInfo) removeEventInfo.push(event.eventInfo._id || event.eventInfo);
                }
            }

            if (removeEventDate.length) {
                await eventDateService.deleteEventDateManyById(removeEventDate);
            }

            await Promise.all(removeEventInfo.map((id) => eventInfoService.removeEventInfoById(id)));

            // Detach the week from the group, then delete the week document itself
            if (groupId) {
                await scheduleWeekService.pullStaticWeekFromGroup(groupId, scheduleWeek._id);
            }
            await scheduleWeekService.deleteById(scheduleWeek._id);

            // Renumber remaining static weeks so their countWeek stays contiguous
            // (0..N-1). getSchedule resolves static weeks positionally, while
            // add/delete match by countWeek, so the two must stay aligned.
            if (scheduleWeek.static) {
                const remaining = await scheduleWeekService.findAllStaticWeeks(groupId);
                remaining.sort((a, b) => a.countWeek - b.countWeek);
                for (let i = 0; i < remaining.length; i += 1) {
                    const w = remaining[i];
                    if (w.countWeek !== i) {
                        await scheduleWeekService.updateCountWeekById(w._id, i);
                        await eventDateService.setCountWeekManyById(scheduleWeekService.collectEventDateIds(w), i);
                    }
                }
            }

            res.json('Deleted!');
        } catch (e) {
            next(e);
        }
    },

    // Reorder static weeks by swapping the countWeek (order index) of two weeks.
    // Static weeks are ordered by countWeek ascending, so swapping the indexes
    // swaps their position in the rotation.
    swapStaticWeeks: async (req, res, next) => {
        try {
            const { weekId1, weekId2 } = req.body;

            const [
                week1,
                week2
            ] = await Promise.all([
                scheduleWeekService.findById(weekId1),
                scheduleWeekService.findById(weekId2)
            ]);

            if (!week1 || !week2 || !week1.static || !week2.static) {
                res.status(404).json('Static week not found');
                return;
            }

            const count1 = week1.countWeek;
            const count2 = week2.countWeek;

            await scheduleWeekService.updateCountWeekById(weekId1, count2);
            await scheduleWeekService.updateCountWeekById(weekId2, count1);

            // Keep each event's stored countWeek aligned with its new week index
            await eventDateService.setCountWeekManyById(scheduleWeekService.collectEventDateIds(week1), count2);
            await eventDateService.setCountWeekManyById(scheduleWeekService.collectEventDateIds(week2), count1);

            res.json('Swapped!');
        } catch (e) {
            next(e);
        }
    }
};
