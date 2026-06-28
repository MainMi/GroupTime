const ApiError = require('../error/ErrorHandler');
const { EVENTDATE_NOT_FOUND } = require('../error/errorMsg');
const {
    scheduleWeekService,
    eventInfoService,
    eventDateService,

} = require('../service/schedule');

module.exports = {
    addStaticEvent: async (req, res, next) => {
        try {
            const {
                groupId, date, teacherName, name, type, color, place, platform, link, tag, description, duration
            } = req.body;

            const { time, day } = date.value;

            const { countWeek } = req.week;

            const eventInfo = await eventInfoService.createEventInfo({
                teacherName,
                name,
                type,
                color,
                place,
                platform,
                link,
                tag,
                description,
                duration
            });

            const eventDate = await eventDateService.addEventDate(day, time, duration, countWeek);

            const event = {
                eventInfo: eventInfo._id,
                eventDate: eventDate._id
            };

            await scheduleWeekService.addEvent(groupId, countWeek, day, event, true);

            res.json(event);
        } catch (e) {
            next(e);
        }
    },

    deleteStaticEvent: async (req, res, next) => {
        try {
            const {
                groupId, date, eventInfoId
            } = req.body;

            const { day, countWeek } = date;

            await eventInfoService.removeEventInfoById(eventInfoId);

            await scheduleWeekService.deletePair(groupId, countWeek, day, eventInfoId, true);

            res.json('Deleted!');
        } catch (e) {
            next(e);
        }
    },

    editEvent: async (req, res, next) => {
        try {
            const {
                groupId, eventInfoId, eventDateId,
                teacherName, name, type, color, place, platform, link, tag, description,
                duration, date, isStatic = false
            } = req.body;

            await eventInfoService.updateEventInfo(eventInfoId, {
                teacherName, name, type, color, place, platform, link, tag, description
            });

            if (eventDateId && date) {
                const { time, day } = date.value;
                const oldEventDate = await eventDateService.getOne(eventDateId);

                if (!oldEventDate) {
                    return next(new ApiError(...Object.values(EVENTDATE_NOT_FOUND)));
                }

                if (isStatic) {
                    const staticWeeksCount = await scheduleWeekService.countStaticWeeks(groupId);
                    const targetCountWeek = staticWeeksCount > 0
                        ? (date.value.countWeek % staticWeeksCount)
                        : oldEventDate.countWeek;

                    await eventDateService.updateEventDate(eventDateId, {
                        time, duration, day, countWeek: targetCountWeek
                    });
                    if (oldEventDate && (oldEventDate.day !== day || oldEventDate.countWeek !== targetCountWeek)) {
                        await scheduleWeekService.deletePair(groupId, oldEventDate.countWeek, oldEventDate.day, eventInfoId, true);
                        await scheduleWeekService.addEvent(groupId, targetCountWeek, day, { eventInfo: eventInfoId, eventDate: eventDateId }, true);
                    }
                } else {
                    // Dynamic event: use countWeek from the sent date
                    const { countWeek } = date.value;
                    await eventDateService.updateEventDate(eventDateId, {
                        time, duration, day, countWeek
                    });
                    if (oldEventDate && (oldEventDate.day !== day || oldEventDate.countWeek !== countWeek)) {
                        await scheduleWeekService.deletePair(groupId, oldEventDate.countWeek, oldEventDate.day, eventInfoId, false);

                        const existingWeek = await scheduleWeekService.findWeek(groupId, countWeek, false);
                        if (!existingWeek) {
                            await scheduleWeekService.createDynamicWeek(groupId, countWeek);
                        }

                        await scheduleWeekService.addEvent(groupId, countWeek, day, { eventInfo: eventInfoId, eventDate: eventDateId }, false);
                    }
                }
            }
            await scheduleWeekService.touchGroupWeeks(groupId);

            res.status(200).json('Edited!');
        } catch (e) {
            next(e);
        }
    },

    addDynamicEvent: async (req, res, next) => {
        try {
            const {
                groupId, date, teacherName, name, type, color, place, platform, link, tag, description, duration
            } = req.body;

            const { time, day, countWeek } = date.value;

            const existingWeek = await scheduleWeekService.findWeek(groupId, countWeek, false);
            if (!existingWeek) {
                await scheduleWeekService.createDynamicWeek(groupId, countWeek);
            }

            const eventInfo = await eventInfoService.createEventInfo({
                teacherName,
                name,
                type,
                color,
                place,
                platform,
                link,
                tag,
                description,
                duration
            });

            const eventDate = await eventDateService.addEventDate(day, time, duration, countWeek);

            const event = {
                eventInfo: eventInfo._id,
                eventDate: eventDate._id
            };

            await scheduleWeekService.addEvent(groupId, countWeek, day, event, false);

            res.json(event);
        } catch (e) {
            next(e);
        }
    },

    deleteDynamicEvent: async (req, res, next) => {
        try {
            const {
                groupId, date, eventInfoId
            } = req.body;

            const { countWeek, day } = date;

            await eventInfoService.removeEventInfoById(eventInfoId);

            await scheduleWeekService.deletePair(groupId, countWeek, day, eventInfoId, false);

            res.json('Deleted!');
        } catch (e) {
            next(e);
        }
    }
};
