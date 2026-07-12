const scheduleDate = require('../../helper/scheduleDate.helper');
const eventInfoService = require('./eventInfo.service');
const eventDateService = require('./eventDate.service');
const scheduleWeekService = require('./scheduleWeek.service');
const { MAX_RECURRING_OCCURRENCES } = require('../../constant/event.enum');

// Which ISO weeks a weekly recurrence lands on. day/time stay constant across
// occurrences (same weekday), so only the week number varies. Restricted to the
// start's ISO week-year — countWeek is year-less, so mixing years would collide
// occurrences onto the same-numbered weeks (same constraint as the .ics import).
const occurrenceWeeks = (startDate, untilDate, interval) => {
    const baseYear = scheduleDate.getISOWeekYear(startDate);
    const dates = scheduleDate.weeklyOccurrences(startDate, untilDate, interval, MAX_RECURRING_OCCURRENCES);
    const weeks = [];
    const seen = new Set();
    dates.forEach((d) => {
        if (scheduleDate.getISOWeekYear(d) !== baseYear) return;
        const week = scheduleDate.getISOWeekNumber(d);
        if (!seen.has(week)) {
            seen.add(week);
            weeks.push(week);
        }
    });
    return weeks;
};

module.exports = {
    occurrenceWeeks,

    // Create one dynamic event per occurrence week (each its own EventInfo +
    // EventDate, like the import path, so occurrences edit/delete independently).
    // `base` carries the shared event fields plus the fixed day/time/duration.
    // Returns how many occurrences were created.
    createRecurringDynamicEvents: async (groupId, base, weeks, userId) => {
        if (!weeks.length) return 0;

        // Ensure all target weeks exist (one lookup, create only the missing ones).
        const existingWeeks = await scheduleWeekService.findExistingWeekNumbers(groupId, weeks, false);
        for (const countWeek of weeks) {
            if (!existingWeeks.has(countWeek)) {
                // eslint-disable-next-line no-await-in-loop -- bound concurrent Atlas writes
                await scheduleWeekService.createDynamicWeek(groupId, countWeek);
            }
        }

        // Batch-insert infos and dates (insertMany preserves order, so the arrays
        // stay index-aligned), then push each pair into its week's slot.
        const eventInfos = await eventInfoService.createEventInfos(weeks.map(() => ({
            teacherName: base.teacherName,
            name: base.name,
            type: base.type,
            color: base.color,
            place: base.place,
            platform: base.platform,
            link: base.link,
            tag: base.tag,
            description: base.description,
            duration: base.duration,
            createdBy: userId,
        })));
        const eventDates = await eventDateService.addEventDates(weeks.map((countWeek) => ({
            day: base.day,
            time: base.time,
            duration: base.duration,
            countWeek,
        })));

        const slots = weeks.map((countWeek, i) => ({
            countWeek,
            day: base.day,
            events: [{ eventInfo: eventInfos[i]._id, eventDate: eventDates[i]._id }],
        }));
        await scheduleWeekService.addEventsBulk(groupId, slots, false);

        return weeks.length;
    },
};
