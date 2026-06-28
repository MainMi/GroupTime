// Deterministic schedule problem detector. Works on the same populated week shape
// returned by scheduleWeek.controller.getSchedule:
//   weekData = { staticWeek?: [ { day, events: [{ eventInfo, eventDate }] } ],
//                dynamicWeek?: [ ... ] }
//
// Returns a flat array of structured issues; phrasing/translation is left to the
// caller (frontend i18n for the UI, generatePrompt for the AI explanation).

const weekEnum = require('../constant/week.enum');
const { isClassType } = require('../constant/eventClassTypes.enum');
const { GAP_THRESHOLD, OVERLOAD_COUNT } = require('../constant/scheduleAnalysis.enum');
const { parseTimeToMinutes, minutesToTime } = require('./time.helper');
const { norm } = require('./string.helper');

const DAY_ORDER = Object.values(weekEnum); // ['Пн','Вв','Ср','Чт','Пт','Сб','Вс']

// A time overlap is only a real clash between two attendance-required classes
// ("пари") — informational or general events (notifications, conferences,
// meetings…) may legitimately share a slot and are never reported as overlapping.
// Class types live in constant/eventClassTypes.enum.js (shared with the assistant
// prompt). An event with no type is treated as a class so genuine clashes in
// legacy/untyped data aren't silently dropped.
const isClassEntry = (e) => {
    const type = (e.type || '').trim();
    if (!type) return true; // unknown/untyped → assume a class so clashes aren't missed
    return isClassType(type);
};

// Flatten an event into the bits the checks need.
const toEntry = (ev) => {
    const info = ev.eventInfo || {};
    const date = ev.eventDate || {};
    const start = parseTimeToMinutes(date.time);
    const duration = Number(date.duration) || 0;
    return {
        name: info.name || '',
        type: info.type || '',
        teacherName: info.teacherName || '',
        place: info.place || '',
        platform: info.platform || '',
        link: info.link || '',
        time: date.time || '',
        start,
        end: start != null ? start + duration : null,
    };
};

// Merge static + dynamic day arrays into one map keyed by day code.
const mergeDays = (weekData) => {
    const byDay = {};
    const collect = (days) => {
        for (const d of days || []) {
            if (!d || !d.day) continue;
            const list = byDay[d.day] || (byDay[d.day] = []);
            for (const ev of d.events || []) {
                if (ev && ev.eventInfo && ev.eventDate) list.push(toEntry(ev));
            }
        }
    };
    collect(weekData?.staticWeek);
    collect(weekData?.dynamicWeek);
    return byDay;
};

// Detect issues for a single group's week. `groupName` and `countWeek` (both
// optional) are attached to every issue so multi-group / multi-week results stay
// distinguishable and an appliable fix can be resolved against the right week.
const detectScheduleIssues = (weekData, groupName, countWeek) => {
    const issues = [];
    const byDay = mergeDays(weekData);

    for (const day of DAY_ORDER) {
        const entries = byDay[day];
        if (!entries || !entries.length) continue;

        const timed = entries
            .filter((e) => e.start != null)
            .sort((a, b) => a.start - b.start);

        // Overlaps: a class starting before another class ends. Only reported when
        // both events are attendance-required classes — regular/informational events
        // may overlap freely (see isClassEntry / CLASS_TYPES).
        for (let i = 1; i < timed.length; i += 1) {
            const prev = timed[i - 1];
            const cur = timed[i];
            if (prev.end != null && cur.start < prev.end && isClassEntry(prev) && isClassEntry(cur)) {
                issues.push({
                    type: 'overlap',
                    severity: 'high',
                    day,
                    groupName,
                    events: [
                        prev.name,
                        cur.name
                    ],
                    meta: { firstTime: prev.time, secondTime: cur.time },
                    // Concrete, appliable fix: move the second class to start right
                    // after the first one ends (duration is preserved on apply).
                    suggestion: { action: 'shiftTime', event: cur.name, newTime: minutesToTime(prev.end) },
                });
            }
        }

        // Gaps: long free windows between consecutive events.
        for (let i = 1; i < timed.length; i += 1) {
            const prev = timed[i - 1];
            const cur = timed[i];
            if (prev.end != null && cur.start - prev.end >= GAP_THRESHOLD) {
                issues.push({
                    type: 'gap',
                    severity: 'low',
                    day,
                    groupName,
                    events: [
                        prev.name,
                        cur.name
                    ],
                    meta: { minutes: cur.start - prev.end, from: prev.time, to: cur.time },
                });
            }
        }

        // Overload: too many events in one day.
        if (entries.length > OVERLOAD_COUNT) {
            issues.push({
                type: 'overload',
                severity: 'medium',
                day,
                groupName,
                events: [],
                meta: { count: entries.length },
            });
        }

        // Duplicates: same subject name more than once in the day (reported once).
        const counts = new Map(); // key -> { name, count }
        for (const e of entries) {
            const key = norm(e.name);
            if (!key) continue;
            const rec = counts.get(key) || { name: e.name, count: 0 };
            rec.count += 1;
            counts.set(key, rec);
        }
        for (const { name, count } of counts.values()) {
            if (count > 1) {
                issues.push({
                    type: 'duplicate',
                    severity: 'medium',
                    day,
                    groupName,
                    events: [name],
                    meta: { count },
                });
            }
        }

        // Missing info: only flag genuinely useful gaps, not e.g. a link for an
        // in-person class.
        for (const e of entries) {
            const missing = [];
            if (!e.teacherName) missing.push('teacher');
            // No idea where it happens (neither a room nor an online platform).
            if (!e.place && !e.platform) missing.push('place');
            // Online class (has a platform) but no join link.
            if (e.platform && !e.link) missing.push('link');
            if (missing.length) {
                issues.push({
                    type: 'missing',
                    severity: 'low',
                    day,
                    groupName,
                    events: [e.name],
                    meta: { fields: missing },
                    // Advisory only — we can't invent the missing values, just point them out.
                    suggestion: { action: 'fillFields', event: e.name, fields: missing },
                });
            }
        }
    }

    return countWeek == null ? issues : issues.map((it) => ({ ...it, countWeek }));
};

// Analyze several groups at once: [{ weekData, groupName, countWeek }] -> flat
// issue list.
const detectIssuesForGroups = (groups) => (groups || [])
    .flatMap(({ weekData, groupName, countWeek }) => detectScheduleIssues(weekData, groupName, countWeek));

// Collapse identical issues. Scanning several weeks re-reports the same recurring
// (static) event every week — buildWeekDataByCountWeek resolves the static week by
// `countWeek % staticWeeksCount`, so adjacent weeks often map to the same one. Two
// issues are "the same" when their type, day, group, events and meta all match.
const dedupeIssues = (issues) => {
    const seen = new Set();
    return (issues || []).filter((it) => {
        const key = JSON.stringify([it.type, it.day, it.groupName, it.events, it.meta]);
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
};

module.exports = {
    detectScheduleIssues,
    detectIssuesForGroups,
    dedupeIssues,
    GAP_THRESHOLD,
    OVERLOAD_COUNT,
};
