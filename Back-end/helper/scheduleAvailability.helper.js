// Common free-slot finder. Works on the same populated week shape produced by
// scheduleWeekService.buildWeekDataByCountWeek (also consumed by the analyzer):
//   weekData = { staticWeek?: [ { day, events: [{ eventInfo, eventDate }] } ],
//                dynamicWeek?: [ ... ] }
//
// Every provided source is treated as busy: a slot is free only when NOBODY is
// busy (the union across all sources). This covers both use cases —
//   • several group schedules → sources = one per group
//   • one member's availability → sources = one per group that member belongs to
// Phrasing/translation is left to the caller (frontend i18n).

const weekEnum = require('../constant/week.enum');
const { parseTimeToMinutes } = require('./time.helper');
const { DAY_START, DAY_END, MIN_SLOT_MINUTES } = require('../constant/scheduleAvailability.enum');

const DAY_ORDER = Object.values(weekEnum); // ['Пн','Вв','Ср','Чт','Пт','Сб','Вс']

// Zero-padded "HH:MM" (time.helper.minutesToTime intentionally leaves the hour
// unpadded for the analyzer's suggestions; the availability UI wants "09:00").
const fmt = (mins) => `${String(Math.floor(mins / 60)).padStart(2, '0')}:${String(mins % 60).padStart(2, '0')}`;

// Flatten one source's week into busy [start, end) intervals keyed by day.
const busyByDayFromWeek = (weekData, label) => {
    const byDay = {};
    const collect = (days) => {
        (days || []).forEach((d) => {
            if (!d || !d.day) return;
            const list = byDay[d.day] || (byDay[d.day] = []);
            (d.events || []).forEach((ev) => {
                const date = ev && ev.eventDate;
                const start = date ? parseTimeToMinutes(date.time) : null;
                if (start == null) return;
                const end = start + (Number(date.duration) || 0);
                if (end > start) list.push({ start, end, label });
            });
        });
    };
    collect(weekData && weekData.staticWeek);
    collect(weekData && weekData.dynamicWeek);
    return byDay;
};

// Merge overlapping/touching intervals into a flat busy timeline (labels dropped).
const mergeIntervals = (intervals) => {
    const sorted = [...intervals].sort((a, b) => a.start - b.start);
    const merged = [];
    sorted.forEach((iv) => {
        const last = merged[merged.length - 1];
        if (last && iv.start <= last.end) last.end = Math.max(last.end, iv.end);
        else merged.push({ start: iv.start, end: iv.end });
    });
    return merged;
};

// Free windows = complement of the merged busy timeline within [dayStart, dayEnd],
// keeping only windows at least `minMinutes` long.
const freeWindows = (mergedBusy, dayStart, dayEnd, minMinutes) => {
    const windows = [];
    let cursor = dayStart;
    mergedBusy.forEach((iv) => {
        if (iv.end <= dayStart || iv.start >= dayEnd) return;
        const s = Math.max(iv.start, dayStart);
        if (s - cursor >= minMinutes) windows.push({ start: cursor, end: s });
        cursor = Math.max(cursor, Math.min(iv.end, dayEnd));
    });
    if (dayEnd - cursor >= minMinutes) windows.push({ start: cursor, end: dayEnd });
    return windows;
};

// Compute common free slots across several sources: [{ label?, weekData }].
// Returns { free, busy } keyed by day — free windows and the (labelled) busy
// breakdown, both as "HH:MM" strings.
const computeFreeSlots = (sources, options = {}) => {
    const {
        dayStart = parseTimeToMinutes(DAY_START),
        dayEnd = parseTimeToMinutes(DAY_END),
        minMinutes = MIN_SLOT_MINUTES,
        days = DAY_ORDER,
    } = options;

    // Gather every source's busy intervals per day.
    const busyByDay = {};
    (sources || []).forEach(({ label, weekData }) => {
        const perDay = busyByDayFromWeek(weekData, label);
        Object.keys(perDay).forEach((day) => {
            (busyByDay[day] || (busyByDay[day] = [])).push(...perDay[day]);
        });
    });

    const free = {};
    const busy = {};
    days.forEach((day) => {
        const dayBusy = busyByDay[day] || [];
        const windows = freeWindows(mergeIntervals(dayBusy), dayStart, dayEnd, minMinutes);
        free[day] = windows.map((w) => ({ start: fmt(w.start), end: fmt(w.end), minutes: w.end - w.start }));
        busy[day] = [...dayBusy]
            .sort((a, b) => a.start - b.start)
            .map((iv) => ({ start: fmt(iv.start), end: fmt(iv.end), label: iv.label }));
    });

    return { free, busy };
};

module.exports = {
    computeFreeSlots,
    busyByDayFromWeek,
    DAY_ORDER,
};
