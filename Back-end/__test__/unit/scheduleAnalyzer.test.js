const { detectScheduleIssues, detectIssuesForGroups } = require('../../helper/scheduleAnalyzer.helper');

// Helper to build a populated event the way scheduleWeek population produces it.
const ev = (name, time, duration, extra = {}) => ({
    eventInfo: {
        name, teacherName: 'T', place: 'A1', ...extra
    },
    eventDate: { time, duration, day: extra.day || 'Пн' },
});

describe('scheduleAnalyzer.detectScheduleIssues', () => {
    test('flags time overlaps on the same day', () => {
        const week = {
            staticWeek: [{
                day: 'Пн',
                events: [
                    ev('Math', '8:30', 90),
                    ev('Physics', '9:30', 90),
                ]
            }]
        };
        const issues = detectScheduleIssues(week);
        const overlap = issues.find((i) => i.type === 'overlap');
        expect(overlap).toBeTruthy();
        expect(overlap.events).toEqual([
            'Math',
            'Physics'
        ]);
    });

    test('does not flag an overlap when one event is a regular (non-class) event', () => {
        const week = {
            staticWeek: [{
                day: 'Ср',
                events: [
                    ev('Дипломна практика', '8:00', 90, { type: 'Lecture', day: 'Ср' }),
                    ev('Інформація', '8:00', 90, { type: 'Notification', day: 'Ср' }),
                ]
            }]
        };
        const issues = detectScheduleIssues(week);
        expect(issues.some((i) => i.type === 'overlap')).toBe(false);
    });

    test('still flags an overlap between two attendance-required classes', () => {
        const week = {
            staticWeek: [{
                day: 'Пн',
                events: [
                    ev('Math', '8:30', 90, { type: 'Lecture' }),
                    ev('Physics', '9:30', 90, { type: 'Seminar' }),
                ]
            }]
        };
        const issues = detectScheduleIssues(week);
        expect(issues.some((i) => i.type === 'overlap')).toBe(true);
    });

    test('attaches a shift-time suggestion to an overlap', () => {
        const week = {
            staticWeek: [{
                day: 'Пн',
                events: [
                    ev('Math', '8:30', 90), // ends 10:00
                    ev('Physics', '9:30', 90),
                ]
            }]
        };
        const overlap = detectScheduleIssues(week).find((i) => i.type === 'overlap');
        expect(overlap.suggestion).toEqual({
            action: 'shiftTime',
            event: 'Physics',
            newTime: '10:00',
        });
    });

    test('does not flag back-to-back events as overlapping', () => {
        const week = {
            staticWeek: [{
                day: 'Пн',
                events: [
                    ev('Math', '8:30', 90), // ends 10:00
                    ev('Physics', '10:00', 90),
                ]
            }]
        };
        const issues = detectScheduleIssues(week);
        expect(issues.some((i) => i.type === 'overlap')).toBe(false);
    });

    test('flags duplicates by subject name within a day', () => {
        const week = {
            staticWeek: [{
                day: 'Пн',
                events: [
                    ev('Math', '8:30', 90),
                    ev('Math', '14:00', 60),
                ]
            }]
        };
        const issues = detectScheduleIssues(week);
        const dup = issues.filter((i) => i.type === 'duplicate');
        expect(dup).toHaveLength(1);
        expect(dup[0].meta.count).toBe(2);
    });

    test('flags missing teacher and ambiguous location', () => {
        const week = {
            staticWeek: [{
                day: 'Пн',
                events: [{ eventInfo: { name: 'Lonely' }, eventDate: { time: '8:30', duration: 60, day: 'Пн' } },]
            }]
        };
        const issues = detectScheduleIssues(week);
        const missing = issues.find((i) => i.type === 'missing');
        expect(missing).toBeTruthy();
        expect(missing.meta.fields).toEqual(expect.arrayContaining([
            'teacher',
            'place'
        ]));
    });

    test('flags a large gap between events', () => {
        const week = {
            staticWeek: [{
                day: 'Пн',
                events: [
                    ev('A', '8:00', 60), // ends 9:00
                    ev('B', '15:00', 60), // 360 min gap
                ]
            }]
        };
        const issues = detectScheduleIssues(week);
        const gap = issues.find((i) => i.type === 'gap');
        expect(gap).toBeTruthy();
        expect(gap.meta.minutes).toBe(360);
    });

    test('returns no issues for a clean single-event day', () => {
        const week = {
            staticWeek: [{
                day: 'Пн',
                events: [ev('Solo', '9:00', 90, { platform: '', link: '' }),]
            }]
        };
        const issues = detectScheduleIssues(week);
        // Teacher + place present, no platform → no missing/overlap/gap/duplicate.
        expect(issues).toHaveLength(0);
    });

    test('tags issues with the group name for multi-group analysis', () => {
        const week = {
            staticWeek: [{
                day: 'Пн',
                events: [
                    ev('Math', '8:30', 90),
                    ev('Physics', '9:30', 90),
                ]
            }]
        };
        const issues = detectIssuesForGroups([{ weekData: week, groupName: 'IP-21' }]);
        expect(issues.every((i) => i.groupName === 'IP-21')).toBe(true);
    });
});
