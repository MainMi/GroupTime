const { BASIC_SCHEDULE } = require('../../constant/schedule.enum');
const groupModel = require('../../model/group.model');
const scheduleWeekModel = require('../../model/scheduleWeek.model');

// Route read-only schedule reads to a replica-set secondary when the caller opts
// in (the public GET schedule endpoints). Write paths and the assistant/analyzer
// omit it and keep reading from the primary to avoid replication-lag staleness.
const READ_SECONDARY = 'secondaryPreferred';
const applyRead = (query, readPref) => (readPref ? query.read(readPref) : query);

// Shared populate spec for a week's events (static and dynamic finders must stay
// identical or the two endpoints drift). Mongoose does NOT propagate the parent
// query's read preference into populate() sub-queries, so when a read preference
// is requested each populate level opts in explicitly via `options`.
const weekEventsPopulate = (readPref) => {
    const options = readPref ? { readPreference: readPref } : {};
    return {
        path: 'schedule.events',
        populate: [
            {
                path: 'eventInfo',
                select: 'name teacherName type color place platform link tag description createdBy',
                model: 'eventInfo',
                options,
                populate: {
                    path: 'createdBy',
                    select: 'nickname firstName lastName avatar',
                    options,
                    populate: { path: 'avatar', select: 'location', options }
                }
            },
            {
                path: 'eventDate',
                select: 'countWeek day time duration data',
                model: 'eventDate',
                options,
                populate: {
                    path: 'data',
                    select: 'name size location minetypes key',
                    model: 'File',
                    options
                }
            }
        ]
    };
};

module.exports = {
    READ_SECONDARY,
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

    // Cheap existence probe — unlike findWeek it fetches nothing and populates
    // nothing (findWeek pulls every event in the week, which bulk callers like
    // the .ics import must not pay per event).
    weekExists: (groupId, countWeek, isStatic = true) => scheduleWeekModel.exists(
        { groupId, countWeek, static: isStatic }
    ),

    // Which of the given week numbers already exist for the group — one query
    // instead of a weekExists probe per week (bulk callers like the .ics import).
    findExistingWeekNumbers: async (groupId, countWeeks, isStatic = true) => {
        const weeks = await scheduleWeekModel
            .find({ groupId, static: isStatic, countWeek: { $in: countWeeks } })
            .select('countWeek')
            .lean();
        return new Set(weeks.map((week) => week.countWeek));
    },

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

    countStaticWeeks: (groupId, readPref) => applyRead(scheduleWeekModel.countDocuments({ groupId, static: true }), readPref),

    findAllDynamicWeeks: (groupId) => scheduleWeekModel.find({ groupId, static: false }),
    findAllStaticWeeks: (groupId) => scheduleWeekModel.find({ groupId, static: true }),

    findStaticWeekByIndex: (groupId, index, readPref) => applyRead(scheduleWeekModel.findOne({ groupId, static: true })
        .sort({ countWeek: 1 })
        .skip(index)
        .lean(), readPref)
        .populate(weekEventsPopulate(readPref)),

    findDynamicWeekByCountWeek: (groupId, countWeek, readPref) => applyRead(scheduleWeekModel.findOne({
        groupId,
        countWeek,
        static: false
    })
        .lean(), readPref)
        .populate(weekEventsPopulate(readPref)),

    findAllWeeks: (groupId) => scheduleWeekModel.find({ groupId }),

    // All static templates for a group, sorted so array position == the index
    // findStaticWeekByIndex would resolve (i.e. countWeek % staticWeeksCount).
    // Events populated — used by the .ics export to expand the whole window in
    // one query instead of one per week.
    findAllStaticWeeksPopulated: (groupId, readPref) => applyRead(scheduleWeekModel
        .find({ groupId, static: true })
        .sort({ countWeek: 1 })
        .lean(), readPref)
        .populate(weekEventsPopulate(readPref)),

    // Populated dynamic weeks for a batch of ISO week numbers (one query for the
    // whole export window).
    findDynamicWeeksByCountWeeks: (groupId, countWeeks, readPref) => applyRead(scheduleWeekModel
        .find({ groupId, static: false, countWeek: { $in: countWeeks } })
        .lean(), readPref)
        .populate(weekEventsPopulate(readPref)),

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
    getWeekVersionByCountWeek: async (groupId, countWeek, readPref) => {
        // The static chain and the dynamic lookup are independent — run them in
        // parallel; each awaited query is a full Atlas round-trip (~150ms+).
        const [
            staticUpdated,
            dynamicUpdated
        ] = await Promise.all([
            (async () => {
                const staticCount = await applyRead(scheduleWeekModel.countDocuments({ groupId, static: true }), readPref);
                if (staticCount <= 0) return 0;
                const sw = await applyRead(scheduleWeekModel
                    .findOne({ groupId, static: true })
                    .sort({ countWeek: 1 })
                    .skip(countWeek % staticCount)
                    .select('updatedAt')
                    .lean(), readPref);
                return sw?.updatedAt ? new Date(sw.updatedAt).getTime() : 0;
            })(),
            (async () => {
                const dw = await applyRead(scheduleWeekModel
                    .findOne({ groupId, countWeek, static: false })
                    .select('updatedAt')
                    .lean(), readPref);
                return dw?.updatedAt ? new Date(dw.updatedAt).getTime() : 0;
            })(),
        ]);

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

    // Bulk variant of addEvent: one write per (week, day) slot instead of one
    // per event. `slots` is [{ countWeek, day, events: [{eventInfo, eventDate}] }].
    addEventsBulk: (groupId, slots, isStatic) => scheduleWeekModel.bulkWrite(
        slots.map(({ countWeek, day, events }) => ({
            updateOne: {
                filter: {
                    groupId, countWeek, static: isStatic, 'schedule.day': day
                },
                update: { $push: { 'schedule.$.events': { $each: events } } }
            }
        }))
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
