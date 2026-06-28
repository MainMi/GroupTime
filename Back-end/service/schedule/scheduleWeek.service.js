const { BASIC_SCHEDULE } = require('../../constant/schedule.enum');
const groupModel = require('../../model/group.model');
const scheduleWeekModel = require('../../model/scheduleWeek.model');

module.exports = {
    // Collect the eventDate ObjectIds referenced by a (non-populated) week document.
    collectEventDateIds: (week) => {
        const ids = [];
        for (const day of (week.schedule || [])) {
            for (const event of (day.events || [])) {
                if (event.eventDate) ids.push(event.eventDate);
            }
        }
        return ids;
    },

    findWeek: (
        groupId,
        countWeek,
        isStatic = true
    ) => scheduleWeekModel.findOne(
        {
            groupId,
            countWeek,
            static: isStatic
        }
    )
        .lean()
        .populate('schedule.events.eventInfo')
        .populate('schedule.events.eventDate'),

    deleteById: (weekId) => scheduleWeekModel.deleteOne({ _id: weekId }),

    findById: (weekId) => scheduleWeekModel.findById(weekId),

    updateCountWeekById: (weekId, countWeek) => scheduleWeekModel.updateOne(
        { _id: weekId },
        { $set: { countWeek } }
    ),

    // Remove a static week reference from the group's schedule.static array
    pullStaticWeekFromGroup: (groupId, weekId) => groupModel.findByIdAndUpdate(
        groupId,
        { $pull: { 'schedule.static': weekId } }
    ),

    countStaticWeeks: (groupId) => scheduleWeekModel.countDocuments({ groupId, static: true }),

    findAllDynamicWeeks: (groupId) => scheduleWeekModel.find({ groupId, static: false }),
    findAllStaticWeeks: (groupId) => scheduleWeekModel.find({ groupId, static: true }),

    findStaticWeekByIndex: (groupId, index) => scheduleWeekModel.findOne({ groupId, static: true })
        .sort({ countWeek: 1 })
        .skip(index)
        .lean()
        .populate({
            path: 'schedule.events',
            populate: [
                {
                    path: 'eventInfo',
                    select: 'name teacherName type color place platform link tag description',
                    model: 'eventInfo'
                },
                {
                    path: 'eventDate',
                    select: 'countWeek day time duration data',
                    model: 'eventDate',
                    populate: {
                        path: 'data',
                        select: 'name size location minetypes key',
                        model: 'File'
                    }
                }
            ]
        }),

    findDynamicWeekByCountWeek: (groupId, countWeek) => scheduleWeekModel.findOne({
        groupId,
        countWeek,
        static: false
    })
        .lean()
        .populate({
            path: 'schedule.events',
            populate: [
                {
                    path: 'eventInfo',
                    select: 'name teacherName type color place platform link tag description',
                    model: 'eventInfo'
                },
                {
                    path: 'eventDate',
                    select: 'countWeek day time duration data',
                    model: 'eventDate',
                    populate: {
                        path: 'data',
                        select: 'name size location minetypes key',
                        model: 'File'
                    }
                }
            ]
        }),

    findAllWeeks: (groupId) => scheduleWeekModel.find({ groupId }),

    // Bump every week's `updatedAt` for a group. Used after an event *edit*
    // (which only mutates the eventInfo/eventDate docs, not the week itself) so
    // the cache version still changes and clients re-fetch. `timestamps:false`
    // prevents Mongoose from also writing updatedAt and conflicting with
    // $currentDate.
    touchGroupWeeks: (groupId) => scheduleWeekModel.updateMany(
        { groupId },
        { $currentDate: { updatedAt: true } },
        { timestamps: false }
    ),

    // The cache version for a group's week = the newest updatedAt across its
    // resolved static + dynamic week documents (ms epoch, 0 if none).
    getWeekVersionByCountWeek: async (groupId, countWeek) => {
        const staticCount = await scheduleWeekModel.countDocuments({ groupId, static: true });

        let staticUpdated = 0;
        if (staticCount > 0) {
            const sw = await scheduleWeekModel
                .findOne({ groupId, static: true })
                .sort({ countWeek: 1 })
                .skip(countWeek % staticCount)
                .select('updatedAt')
                .lean();
            staticUpdated = sw?.updatedAt ? new Date(sw.updatedAt).getTime() : 0;
        }

        const dw = await scheduleWeekModel
            .findOne({ groupId, countWeek, static: false })
            .select('updatedAt')
            .lean();
        const dynamicUpdated = dw?.updatedAt ? new Date(dw.updatedAt).getTime() : 0;

        return Math.max(staticUpdated, dynamicUpdated);
    },

    // Build the populated { staticWeek, dynamicWeek } data for one group at a
    // given ISO week. Mirrors scheduleWeek.controller.getSchedule so the AI
    // assistant / analyzer can reuse the exact same resolution logic.
    buildWeekDataByCountWeek: async (groupId, countWeek) => {
        const staticWeeksCount = await scheduleWeekModel.countDocuments({ groupId, static: true });

        let staticWeek = null;
        if (staticWeeksCount > 0) {
            const staticWeekIndex = countWeek % staticWeeksCount;
            staticWeek = await module.exports.findStaticWeekByIndex(groupId, staticWeekIndex);
        }

        const dynamicWeek = await module.exports.findDynamicWeekByCountWeek(groupId, countWeek);

        const result = { staticWeeksCount, countWeek };
        if (staticWeek?.schedule?.some((day) => day.events.length > 0)) {
            result.staticWeek = staticWeek.schedule;
        }
        if (dynamicWeek?.schedule?.some((day) => day.events.length > 0)) {
            result.dynamicWeek = dynamicWeek.schedule;
        }
        return result;
    },

    isExist: (groupId, countWeek, day, isStatic) => scheduleWeekModel.exists({
        groupId,
        countWeek,
        static: isStatic,
        'week.day': day
    }),

    pushWeek: (groupId, countWeek, isStatic, newWeek) => scheduleWeekModel.findOneAndUpdate(
        {
            groupId,
            countWeek,
            static: isStatic
        },
        {
            $push: {
                week: newWeek
            }
        },
        {
            upsert: true,
            new: true
        }
    ),

    addEvent: (
        groupId,
        countWeek,
        day,
        event,
        isStatic
    ) => scheduleWeekModel.findOneAndUpdate(
        {
            groupId, countWeek, static: isStatic, 'schedule.day': day
        },
        {
            $push: {
                'schedule.$.events': event
            }
        },
        {
            new: true
        }
    ),

    deletePair: (
        groupId,
        countWeek,
        day,
        eventInfoId,
        isStatic = true
    ) => scheduleWeekModel.findOneAndUpdate(
        {
            groupId, countWeek, static: isStatic, 'schedule.day': day,
        },
        {
            $pull: {
                'schedule.$.events': { eventInfo: eventInfoId }
            }
        },
        { new: true }
    ),

    addExtraInfo: (groupId, countWeek, day, extraInfoId, isStatic = true) => scheduleWeekModel.findOneAndUpdate(
        {
            groupId, countWeek, static: isStatic, 'week.day': day
        },
        {
            $push: {
                'week.$.events.extraInfo': extraInfoId
            }
        },
        {
            new: true
        }
    ),

    deleteExtraInfo: (groupId, countWeek, day, extraInfoId, isStatic = true) => scheduleWeekModel.findOneAndUpdate(
        {
            groupId, countWeek, static: isStatic, 'week.day': day
        },
        {
            $pull: {
                'week.$.events.pairsInfo': { $in: extraInfoId }
            }
        }
    ),

    deleteExtraInfosFromScheduleWeek: (groupId, countWeek, extraInfoIds, isStatic = true) => scheduleWeekModel.findOneAndUpdate(
        { groupId, countWeek, static: isStatic },
        {
            $pull: {
                'week.$[].events.extraInfo': { $in: extraInfoIds }
            }
        }
    ),

    createStaticWeek: async (groupId, countWeek) => {
        const scheduleWeek = await scheduleWeekModel.create({
            groupId,
            countWeek,
            static: true,
            schedule: BASIC_SCHEDULE
        });

        await groupModel.findByIdAndUpdate(
            groupId,
            { $push: { 'schedule.static': scheduleWeek._id } },
            { new: true }
        );

        return scheduleWeek;
    },

    createDynamicWeek: async (groupId, countWeek) => {
        const scheduleWeek = await scheduleWeekModel.create({
            groupId,
            countWeek,
            static: false,
            schedule: BASIC_SCHEDULE,
            updatedAt: new Date()
        });

        await groupModel.findByIdAndUpdate(
            groupId,
            { $push: { 'schedule.current': scheduleWeek._id } },
            { new: true }
        );

        return scheduleWeek;
    },
    mergeSchedules: (staticSchedule, dynamicSchedule) => {
        const daysOfWeek = [
            'Monday',
            'Tuesday',
            'Wednesday',
            'Thursday',
            'Friday',
            'Saturday',
            'Sunday'
        ];

        const mergedSchedule = daysOfWeek.map((dayName) => {
            const staticDay = staticSchedule.find((day) => day.day === dayName) || { day: dayName, events: [] };
            const dynamicDay = dynamicSchedule.find((day) => day.day === dayName) || { day: dayName, events: [] };

            const mergedEvents = [
                ...staticDay.events,
                ...dynamicDay.events
            ];

            return { day: dayName, events: mergedEvents };
        });

        return mergedSchedule;
    }
};
