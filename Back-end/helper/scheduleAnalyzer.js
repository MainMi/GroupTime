// Deterministic schedule problem detector. Works on the same populated week shape
// returned by scheduleWeek.controller.getSchedule:
//   weekData = { staticWeek?: [ { day, events: [{ eventInfo, eventDate }] } ],
//                dynamicWeek?: [ ... ] }
//
// Returns a flat array of structured issues; phrasing/translation is left to the
// caller (frontend i18n for the UI, generatePrompt for the AI explanation).

const weekEnum = require('../constant/week.enum');

const DAY_ORDER = Object.values(weekEnum); // ['Пн','Вв','Ср','Чт','Пт','Сб','Вс']

// Thresholds (minutes / counts) — tuned for a university day.
const GAP_THRESHOLD = 150; // a free window longer than this is flagged
const OVERLOAD_COUNT = 6; // more events than this in one day is "overloaded"

const parseTimeToMinutes = (time) => {
    if (typeof time !== 'string') return null;
    const m = time.match(/(\d{1,2})[:.](\d{2})/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
};

const normalizeName = (name) => (name || '').trim().toLowerCase();

// Flatten an event into the bits the checks need.
const toEntry = (ev) => {
    const info = ev.eventInfo || {};
    const date = ev.eventDate || {};
    const start = parseTimeToMinutes(date.time);
    const duration = Number(date.duration) || 0;
    return {
        name: info.name || '',
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

// Detect issues for a single group's week. `groupName` (optional) is attached to
// every issue so multi-group results stay distinguishable.
const detectScheduleIssues = (weekData, groupName) => {
    const issues = [];
    const byDay = mergeDays(weekData);

    for (const day of DAY_ORDER) {
        const entries = byDay[day];
        if (!entries || !entries.length) continue;

        const timed = entries
            .filter((e) => e.start != null)
            .sort((a, b) => a.start - b.start);

        // Overlaps: any event starting before the previous one ends.
        for (let i = 1; i < timed.length; i += 1) {
            const prev = timed[i - 1];
            const cur = timed[i];
            if (prev.end != null && cur.start < prev.end) {
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
            const key = normalizeName(e.name);
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
                });
            }
        }
    }

    return issues;
};

// Analyze several groups at once: [{ weekData, groupName }] -> flat issue list.
const detectIssuesForGroups = (groups) => (groups || []).flatMap(({ weekData, groupName }) => detectScheduleIssues(weekData, groupName));

module.exports = {
    detectScheduleIssues,
    detectIssuesForGroups,
    GAP_THRESHOLD,
    OVERLOAD_COUNT,
};
