const ics = require('ics');
const scheduleDate = require('../../helper/scheduleDate.helper');
const { parseTimeToMinutes } = require('../../helper/time.helper');
const { weekEnum } = require('../../constant');
const { DEFAULT_EVENT_DURATION } = require('../../constant/event.enum');
const { CALENDAR_WEEKS_AHEAD, CALENDAR_PRODID } = require('../../constant/export.enum');
const scheduleWeekService = require('./scheduleWeek.service');

// weekEnum values are Monday-first, matching how eventDate.day is stored.
const DAYS = Object.values(weekEnum);
const MS_PER_DAY = 86400000;
const MS_PER_HOUR = 3600000;

// A day's { eventInfo, eventDate } pairs become dated VEVENTs. `monday` is the UTC
// Monday of the ISO week; times are group wall-clock at `gmt`, so the absolute
// instant is that wall-clock minus the offset.
const collectDay = (out, seen, schedule, monday, gmt, isoWeek, calName) => {
    if (!Array.isArray(schedule)) return;
    schedule.forEach((day) => {
        const dayIndex = DAYS.indexOf(day.day);
        if (dayIndex < 0) return;
        (day.events || []).forEach(({ eventInfo, eventDate }) => {
            if (!eventInfo || !eventDate || !eventDate.time) return;

            // One occurrence per (event, week); guards against an event living in
            // both the static template and a dynamic override for the same week.
            const uid = `${eventInfo._id}-w${isoWeek}@grouptime`;
            if (seen.has(uid)) return;
            seen.add(uid);

            const minutes = parseTimeToMinutes(eventDate.time);
            if (minutes == null || Number.isNaN(minutes)) return;

            const dayDate = new Date(monday.getTime() + dayIndex * MS_PER_DAY);
            const wallMs = Date.UTC(
                dayDate.getUTCFullYear(),
                dayDate.getUTCMonth(),
                dayDate.getUTCDate(),
                Math.floor(minutes / 60),
                minutes % 60,
            );
            const dt = new Date(wallMs - gmt * MS_PER_HOUR);

            const descriptionParts = [
                eventInfo.teacherName,
                eventInfo.type,
                eventInfo.platform,
                eventInfo.link,
                eventInfo.description,
            ].filter(Boolean);

            out.push({
                uid,
                title: eventInfo.name || 'Event',
                start: [
                    dt.getUTCFullYear(),
                    dt.getUTCMonth() + 1,
                    dt.getUTCDate(),
                    dt.getUTCHours(),
                    dt.getUTCMinutes()
                ],
                startInputType: 'utc',
                startOutputType: 'utc',
                duration: { minutes: eventDate.duration || DEFAULT_EVENT_DURATION },
                description: descriptionParts.join(' • ') || undefined,
                location: eventInfo.place || undefined,
                productId: CALENDAR_PRODID,
                calName,
            });
        });
    });
};

const emptyCalendar = (calName) => [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${CALENDAR_PRODID}`,
    `X-WR-CALNAME:${calName}`,
    'END:VCALENDAR',
    '',
].join('\r\n');

module.exports = {
    // Build an iCalendar (.ics) feed for a group: expand its static (recurring)
    // and dynamic (one-off) events across a rolling CALENDAR_WEEKS_AHEAD window
    // into absolute-time VEVENTs. Inverse of import.service. Returns .ics text.
    buildIcsForGroup: async (group) => {
        const groupId = group._id;
        const gmt = group?.parameters?.gmt || 0;
        const calName = group?.name || 'GroupTime';
        const READ = scheduleWeekService.READ_SECONDARY;

        const firstMonday = scheduleDate.getISOWeekMonday(new Date());
        const mondays = Array.from({ length: CALENDAR_WEEKS_AHEAD }, (_, i) => (
            new Date(firstMonday.getTime() + i * 7 * MS_PER_DAY)
        ));
        const weekNumbers = [...new Set(mondays.map((m) => scheduleDate.getISOWeekNumber(m)))];

        const [
            staticWeeks,
            dynamicWeeks
        ] = await Promise.all([
            scheduleWeekService.findAllStaticWeeksPopulated(groupId, READ),
            scheduleWeekService.findDynamicWeeksByCountWeeks(groupId, weekNumbers, READ),
        ]);

        const staticCount = staticWeeks.length;
        const dynamicByWeek = new Map(dynamicWeeks.map((w) => [
            w.countWeek,
            w.schedule
        ]));

        const events = [];
        const seen = new Set();
        mondays.forEach((monday) => {
            const isoWeek = scheduleDate.getISOWeekNumber(monday);
            const staticSchedule = staticCount > 0 ? staticWeeks[isoWeek % staticCount]?.schedule : null;
            collectDay(events, seen, staticSchedule, monday, gmt, isoWeek, calName);
            collectDay(events, seen, dynamicByWeek.get(isoWeek), monday, gmt, isoWeek, calName);
        });

        if (!events.length) return emptyCalendar(calName);

        const { error, value } = ics.createEvents(events);
        if (error) throw error;
        return value;
    },
};
