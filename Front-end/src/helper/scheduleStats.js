import { colorForType, DEFAULT_TYPE_COLOR, DEFAULT_EVENT_DURATION } from '../constants/type/eventEnum';
import { ORDERED_BACKEND_DAYS } from '../constants/scheduleEnum';

// Flatten a week (static + dynamic) into a plain list of populated events.
const collectEvents = (data) => {
    const out = [];
    ['staticWeek', 'dynamicWeek'].forEach((key) => (data?.[key] || []).forEach((day) => {
        (day.events || []).forEach((ev) => {
            if (ev?.eventInfo && ev?.eventDate) out.push(ev);
        });
    }));
    return out;
};

// Load statistics for one displayed week: total time, time per type/tag and the
// busiest days. Durations are in minutes; a missing duration falls back to the
// default event length so an untimed event still counts.
export const computeScheduleStats = (data) => {
    const events = collectEvents(data);
    const byType = new Map(); // key -> { name, color, minutes, count }
    const byTag = new Map(); // name -> { name, minutes, count }
    const byDay = {};
    ORDERED_BACKEND_DAYS.forEach((d) => { byDay[d] = 0; });
    let totalMinutes = 0;

    events.forEach((ev) => {
        const ei = ev.eventInfo;
        const duration = Number(ev.eventDate?.duration) || DEFAULT_EVENT_DURATION;
        totalMinutes += duration;

        const day = ev.eventDate?.day;
        if (day && day in byDay) byDay[day] += duration;

        const typeName = ei.type || '—';
        const typeKey = typeName.toLowerCase();
        const typeRec = byType.get(typeKey)
            || { name: typeName, color: ei.color || colorForType(ei.type) || DEFAULT_TYPE_COLOR, minutes: 0, count: 0 };
        typeRec.minutes += duration;
        typeRec.count += 1;
        byType.set(typeKey, typeRec);

        const tags = Array.isArray(ei.tag) ? ei.tag : (ei.tag ? [ei.tag] : []);
        tags.forEach((tag) => {
            if (!tag) return;
            const rec = byTag.get(tag) || { name: tag, minutes: 0, count: 0 };
            rec.minutes += duration;
            rec.count += 1;
            byTag.set(tag, rec);
        });
    });

    return {
        totalMinutes,
        eventCount: events.length,
        types: [...byType.values()].sort((a, b) => b.minutes - a.minutes),
        tags: [...byTag.values()].sort((a, b) => b.minutes - a.minutes),
        days: ORDERED_BACKEND_DAYS.map((d) => ({ day: d, minutes: byDay[d] })),
    };
};
