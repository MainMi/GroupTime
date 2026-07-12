const { computeFreeSlots } = require('../../helper/scheduleAvailability.helper');

// Populated event shape as scheduleWeek population produces it.
const ev = (time, duration) => ({ eventInfo: { name: 'X' }, eventDate: { time, duration } });
const src = (label, day, events) => ({ label, weekData: { staticWeek: [{ day, events }] } });

describe('scheduleAvailability.computeFreeSlots', () => {
    test('returns the free complement within the working day', () => {
        const { free } = computeFreeSlots([src('A', 'Пн', [ev('9:00', 90)])]);
        expect(free['Пн']).toEqual([
            { start: '08:00', end: '09:00', minutes: 60 },
            { start: '10:30', end: '22:00', minutes: 690 },
        ]);
    });

    test('a slot is free only when NO source is busy (union across sources)', () => {
        const sources = [
            src('A', 'Пн', [ev('9:00', 60)]), // busy 09:00–10:00
            src('B', 'Пн', [ev('11:00', 60)]), // busy 11:00–12:00
        ];
        const { free } = computeFreeSlots(sources);
        // The 10:00–11:00 gap is free for both; 09:00–10:00 and 11:00–12:00 are not.
        expect(free['Пн']).toContainEqual({ start: '10:00', end: '11:00', minutes: 60 });
        expect(free['Пн']).toContainEqual({ start: '08:00', end: '09:00', minutes: 60 });
        expect(free['Пн'].some((w) => w.start === '09:00')).toBe(false);
    });

    test('merges overlapping busy intervals and drops sub-threshold gaps', () => {
        const sources = [
            src('A', 'Пн', [ev('9:00', 90)]), // 09:00–10:30
            src('B', 'Пн', [ev('10:00', 90)]), // 10:00–11:30 (overlaps A)
        ];
        const { free } = computeFreeSlots(sources, { minMinutes: 60 });
        // Merged busy is 09:00–11:30; the 08:00–09:00 gap (60m) survives.
        expect(free['Пн']).toContainEqual({ start: '08:00', end: '09:00', minutes: 60 });
        expect(free['Пн']).toContainEqual({ start: '11:30', end: '22:00', minutes: 630 });
    });

    test('the busy breakdown keeps each source label', () => {
        const { busy } = computeFreeSlots([src('Group A', 'Вв', [ev('9:00', 60)])]);
        expect(busy['Вв']).toEqual([{ start: '09:00', end: '10:00', label: 'Group A' }]);
    });
});
