import { computeScheduleStats } from './scheduleStats';

const ev = (type, duration, day, tag) => ({
    eventInfo: { name: `${type}-${day}`, type, tag },
    eventDate: { duration, day },
});

describe('computeScheduleStats', () => {
    test('empty week yields zero totals', () => {
        const s = computeScheduleStats({});
        expect(s.totalMinutes).toBe(0);
        expect(s.eventCount).toBe(0);
        expect(s.types).toEqual([]);
        expect(s.days).toHaveLength(7);
    });

    test('aggregates minutes per type, day and tag', () => {
        const data = {
            staticWeek: [
                { day: 'Пн', events: [ev('Lecture', 90, 'Пн', 'Education'), ev('Seminar', 60, 'Пн', 'Science')] },
            ],
            dynamicWeek: [
                { day: 'Вв', events: [ev('Lecture', 120, 'Вв', 'Education')] },
            ],
        };
        const s = computeScheduleStats(data);

        expect(s.totalMinutes).toBe(270);
        expect(s.eventCount).toBe(3);

        // Lecture is the biggest type (90 + 120 = 210), sorted first.
        expect(s.types[0].name).toBe('Lecture');
        expect(s.types[0].minutes).toBe(210);

        // Monday has 150 min, Tuesday 120.
        const byDay = Object.fromEntries(s.days.map((d) => [d.day, d.minutes]));
        expect(byDay['Пн']).toBe(150);
        expect(byDay['Вв']).toBe(120);

        // Education tag spans both lectures.
        const edu = s.tags.find((x) => x.name === 'Education');
        expect(edu.minutes).toBe(210);
    });

    test('a missing duration falls back to the default length', () => {
        const data = { staticWeek: [{ day: 'Ср', events: [{ eventInfo: { type: 'Lecture' }, eventDate: { day: 'Ср' } }] }] };
        const s = computeScheduleStats(data);
        expect(s.totalMinutes).toBe(90); // DEFAULT_EVENT_DURATION
    });
});
