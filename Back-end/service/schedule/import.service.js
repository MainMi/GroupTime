const ical = require('node-ical');
const scheduleDate = require('../../helper/scheduleDate.helper');
const { weekEnum } = require('../../constant');
const eventInfoService = require('./eventInfo.service');
const eventDateService = require('./eventDate.service');
const scheduleWeekService = require('./scheduleWeek.service');
const {
    IMPORTED_EVENT_TYPE, IMPORTED_EVENT_NAME, DEFAULT_EVENT_DURATION, MAX_IMPORT_EVENTS
} = require('../../constant/event.enum');

const DAYS = Object.values(weekEnum);

// Interpret an absolute instant as wall-clock time at the given GMT offset:
// shift by the offset, then read the UTC fields. Server-timezone independent.
const atOffset = (date, gmtHours) => new Date(date.getTime() + gmtHours * 3600000);

// Monday-based week-day name (matches the schedule's weekEnum ordering).
const toDayName = (date) => {
    const n = date.getUTCDay();
    return DAYS[!n ? 6 : n - 1];
};
const toTime = (date) => `${String(date.getUTCHours()).padStart(2, '0')}:${String(date.getUTCMinutes()).padStart(2, '0')}`;
const clampDuration = (minutes) => Math.max(5, Math.min(300, Math.round(minutes) || DEFAULT_EVENT_DURATION));

// node-ical returns { params, val } instead of a plain string for properties that
// carry iCal parameters (e.g. Outlook's `SUMMARY;LANGUAGE=en-us:...`) — unwrap.
const text = (prop) => {
    if (prop && typeof prop === 'object' && 'val' in prop) return String(prop.val);
    return prop == null ? '' : String(prop);
};

// Occurrence dates of a recurring VEVENT inside [from, to], minus its EXDATEs.
const expandRecurrences = (item, from, to) => {
    const exdates = new Set(
        Object.values(item.exdate || {}).map((d) => new Date(d).getTime())
    );
    return item.rrule.between(from, to, true)
        .filter((d) => !exdates.has(d.getTime()));
};

module.exports = {
    // Parse raw iCalendar (.ics) text into normalized one-off events. Works with
    // exports from Google Calendar, Outlook and Apple Calendar (all emit VEVENTs).
    // Recurring events (RRULE) are expanded into their individual occurrences
    // within [rangeFrom, rangeTo] (defaults to the current calendar year).
    parseIcs: (icsText, rangeFrom, rangeTo) => {
        const data = ical.sync.parseICS(icsText);
        const from = rangeFrom || new Date(new Date().getFullYear(), 0, 1);
        const to = rangeTo || new Date(new Date().getFullYear() + 1, 0, 1);
        const events = [];
        Object.values(data).forEach((item) => {
            if (item.type !== 'VEVENT' || !item.start) return;
            const start = new Date(item.start);
            if (Number.isNaN(start.getTime())) return;
            const end = item.end ? new Date(item.end) : null;
            const durationMs = end && !Number.isNaN(end.getTime()) ? end - start : null;
            const base = {
                name: (text(item.summary) || IMPORTED_EVENT_NAME).slice(0, 50),
                description: text(item.description).slice(0, 500),
                place: text(item.location).slice(0, 50),
            };
            // VEVENT UID (RFC 5545) identifies the event across re-imports; the
            // occurrence start disambiguates expanded recurrences. Rare UID-less
            // events fall back to name+start.
            const uid = text(item.uid) || `${base.name}|${start.toISOString()}`;
            const starts = item.rrule ? expandRecurrences(item, from, to) : [start];
            starts.forEach((occurrenceStart) => {
                events.push({
                    ...base,
                    uid: `${uid}:${occurrenceStart.toISOString()}`,
                    start: occurrenceStart,
                    end: durationMs != null ? new Date(occurrenceStart.getTime() + durationMs) : null,
                });
            });
        });
        return events;
    },

    // Create one dynamic (one-off) event per normalized item, reusing the same
    // services as manual event creation. Times are interpreted in the group's
    // timezone (`gmt`, hours offset). Only events in the current ISO year are
    // imported: countWeek stores a year-less week number, so other years' events
    // would land on this year's same-numbered weeks. Re-importing the same
    // calendar is idempotent (dedup by EventInfo.importUid). Returns how many
    // events were actually created.
    importEvents: async (groupId, events, userId, gmt = 0) => {
        const currentWeekYear = scheduleDate.getISOWeekYear(new Date());
        const importable = events
            .filter((ev) => scheduleDate.getISOWeekYear(atOffset(ev.start, gmt)) === currentWeekYear)
            .slice(0, MAX_IMPORT_EVENTS);
        if (!importable.length) return 0;

        // Skip occurrences already imported into this group (and duplicates
        // within the file itself).
        const existing = await eventInfoService.findImportUids(
            importable.map((ev) => `${groupId}:${ev.uid}`)
        );
        const seenKeys = new Set(existing.map((doc) => doc.importUid));
        const rows = [];
        for (const ev of importable) {
            const importUid = `${groupId}:${ev.uid}`;
            if (!seenKeys.has(importUid)) {
                seenKeys.add(importUid);
                const localStart = atOffset(ev.start, gmt);
                rows.push({
                    ev,
                    importUid,
                    countWeek: scheduleDate.getISOWeekNumber(localStart),
                    day: toDayName(localStart),
                    time: toTime(localStart),
                    duration: ev.end
                        ? clampDuration((ev.end - ev.start) / 60000)
                        : DEFAULT_EVENT_DURATION,
                });
            }
        }
        if (!rows.length) return 0;

        // Ensure all target weeks exist: one lookup for the whole batch, then
        // create only the missing ones.
        const targetWeeks = [...new Set(rows.map((row) => row.countWeek))];
        const existingWeeks = await scheduleWeekService.findExistingWeekNumbers(groupId, targetWeeks, false);
        for (const countWeek of targetWeeks) {
            if (!existingWeeks.has(countWeek)) {
                // eslint-disable-next-line no-await-in-loop
                await scheduleWeekService.createDynamicWeek(groupId, countWeek);
            }
        }

        // Batch-insert infos and dates (insertMany preserves order, so the two
        // arrays stay index-aligned), then push into weeks per (week, day) slot.
        const eventInfos = await eventInfoService.createEventInfos(rows.map(({ ev, importUid }) => ({
            name: ev.name || IMPORTED_EVENT_NAME,
            description: ev.description,
            place: ev.place,
            type: IMPORTED_EVENT_TYPE,
            createdBy: userId,
            importUid,
        })));
        const eventDates = await eventDateService.addEventDates(rows.map(({
            countWeek, day, time, duration
        }) => ({
            countWeek, day, time, duration
        })));

        const slots = new Map();
        rows.forEach((row, i) => {
            const slotKey = `${row.countWeek}|${row.day}`;
            if (!slots.has(slotKey)) {
                slots.set(slotKey, { countWeek: row.countWeek, day: row.day, events: [] });
            }
            slots.get(slotKey).events.push({
                eventInfo: eventInfos[i]._id,
                eventDate: eventDates[i]._id,
            });
        });
        await scheduleWeekService.addEventsBulk(groupId, [...slots.values()], false);

        return rows.length;
    },
};
