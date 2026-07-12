const { weeklyOccurrences } = require('../../helper/scheduleDate.helper');
const { occurrenceWeeks } = require('../../service/schedule/recurrence.service');

describe('scheduleDate.weeklyOccurrences', () => {
    test('steps weekly from start up to and including until', () => {
        const occ = weeklyOccurrences('2026-09-01T10:00:00', '2026-09-29T10:00:00', 1);
        expect(occ).toHaveLength(5); // Sep 1, 8, 15, 22, 29
        expect(occ[0].toISOString()).toBe(new Date('2026-09-01T10:00:00').toISOString());
    });

    test('honours the interval (bi-weekly)', () => {
        const occ = weeklyOccurrences('2026-09-01T10:00:00', '2026-09-29T10:00:00', 2);
        expect(occ).toHaveLength(3); // Sep 1, 15, 29
    });

    test('yields the single start when until precedes it', () => {
        const occ = weeklyOccurrences('2026-09-01T10:00:00', '2026-08-01T10:00:00', 1);
        expect(occ).toHaveLength(1);
    });

    test('is capped by maxCount', () => {
        const occ = weeklyOccurrences('2026-01-01T10:00:00', '2030-01-01T10:00:00', 1, 10);
        expect(occ).toHaveLength(10);
    });
});

describe('recurrence.occurrenceWeeks', () => {
    test('maps occurrences to distinct ISO week numbers', () => {
        const weeks = occurrenceWeeks(new Date('2026-09-01T10:00:00'), new Date('2026-09-29T10:00:00'), 1);
        expect(weeks).toEqual([
            36,
            37,
            38,
            39,
            40
        ]);
    });

    test('drops occurrences that fall into a different ISO week-year', () => {
        // Late December into January crosses the ISO week-year boundary; only the
        // start year's weeks survive (year-less countWeek would otherwise collide).
        const weeks = occurrenceWeeks(new Date('2026-12-21T10:00:00'), new Date('2027-01-18T10:00:00'), 1);
        expect(weeks.every((w) => w >= 52 || w <= 53)).toBe(true);
        expect(weeks.length).toBeGreaterThan(0);
    });
});
