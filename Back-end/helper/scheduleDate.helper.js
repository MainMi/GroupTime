const { CURRENT_YEAR, CURRENT_MONTH } = require('../constant/constants.enum');
const getDayOfWeekName = require('../constant/week.enum');

const startYearDate = new Date(CURRENT_MONTH >= 8 ? CURRENT_YEAR : CURRENT_YEAR - 1, 8, 1);

const convertDayOfWeek = (d) => (d === 0 ? 6 : d - 1);
const calculateSemester = (m) => (m > 7 || m < 2 ? 1 : 2);

function findDays(start, end) {
    const startDate = new Date(start[0], start[1] - 1, start[2]);
    const endDate = new Date(end[0], end[1] - 1, end[2]);
    const timeDiff = endDate - startDate;
    return Math.floor(timeDiff / (1000 * 60 * 60 * 24));
}

function generateRandomTimeSlot(startHour = 4, endHour = 23, stepMinutes = 5) {
    const startTime = new Date();
    startTime.setHours(startHour, 0, 0, 0);

    const endTime = new Date();
    endTime.setHours(endHour, 0, 0, 0);

    const totalMinutes = (endTime - startTime) / (1000 * 60);
    const stepCount = Math.floor(totalMinutes / stepMinutes);

    const randomStep = Math.floor(Math.random() * (stepCount + 1));
    const randomTime = new Date(startTime.getTime() + randomStep * stepMinutes * 60000);

    const hours = randomTime.getHours().toString().padStart(2, '0');
    const minutes = randomTime.getMinutes().toString().padStart(2, '0');
    return `${hours}:${minutes}`;
}

const getISOWeekNumber = (d) => {
    const date = new Date(d);
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((date - yearStart) / 86400000) + 1) / 7);

    return weekNo;
};

// ISO week-numbering year for a date. Differs from the calendar year around New
// Year (e.g. 2027-01-01 belongs to ISO year 2026, week 53) — pair it with
// getISOWeekNumber whenever week numbers from different years could collide.
const getISOWeekYear = (d) => {
    const date = new Date(d);
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));
    return date.getUTCFullYear();
};

// UTC Monday 00:00 of the ISO week containing `d`. Anchors year-less week numbers
// back to a concrete calendar date when expanding a schedule into dated events.
const getISOWeekMonday = (d) => {
    const date = new Date(d);
    const day = date.getUTCDay() || 7; // Sunday (0) -> 7 so Monday is day 1
    date.setUTCDate(date.getUTCDate() - (day - 1));
    date.setUTCHours(0, 0, 0, 0);
    return date;
};

// Next absolute datetime (UTC) an event occurs strictly after `from`, or null.
// Times are group wall-clock at `gmtHours`, so the instant is wall-clock minus
// the offset (same convention as the .ics export). For static (recurring) events
// the occurrence repeats in every ISO week where isoWeek % staticCount == the
// event's static index (its countWeek); dynamic events occur once, in the ISO
// week equal to their countWeek.
const nextEventOccurrence = (ev, gmtHours = 0, from = new Date()) => {
    const {
        isStatic, countWeek, staticCount, dayIndex, minutes,
    } = ev;
    if (dayIndex < 0 || minutes == null || Number.isNaN(minutes)) return null;

    const startMonday = getISOWeekMonday(from);
    const horizon = isStatic ? Math.max(staticCount || 1, 1) + 1 : 60;
    for (let i = 0; i < horizon; i += 1) {
        const monday = new Date(startMonday.getTime() + i * 7 * 86400000);
        const isoWeek = getISOWeekNumber(monday);
        const applies = isStatic
            ? (staticCount > 0 && isoWeek % staticCount === countWeek)
            : (isoWeek === countWeek);
        if (applies) {
            const dayDate = new Date(monday.getTime() + dayIndex * 86400000);
            const wallMs = Date.UTC(
                dayDate.getUTCFullYear(),
                dayDate.getUTCMonth(),
                dayDate.getUTCDate(),
                Math.floor(minutes / 60),
                minutes % 60,
            );
            const dt = new Date(wallMs - gmtHours * 3600000);
            if (dt > from) return dt;
        }
    }
    return null;
};

// Distinct ISO week numbers covered by [from, to] (inclusive), stepping by day so
// short ranges that cross a week boundary are handled. Capped to avoid abuse.
const isoWeeksInRange = (from, to) => {
    const start = new Date(from);
    const end = new Date(to);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
        return [getISOWeekNumber(start)];
    }
    const weeks = new Set();
    const cursor = new Date(start);
    let guard = 0;
    while (cursor <= end && guard < 400) {
        weeks.add(getISOWeekNumber(cursor));
        cursor.setDate(cursor.getDate() + 1);
        guard += 1;
    }
    return [...weeks];
};

// Midpoint (ISO string) between two timestamps — used to slot a reordered week
// between its neighbours without renumbering the whole sequence.
const calculateMiddleTimestamp = (earlierTimestamp, laterTimestamp) => {
    const earlierTime = new Date(earlierTimestamp).getTime();
    const laterTime = new Date(laterTimestamp).getTime();
    return new Date((earlierTime + laterTime) / 2).toISOString();
};

module.exports = {
    calculateScheduleDate: (find = new Date(), start = startYearDate) => {
        const findDate = [
            find.getFullYear(),
            find.getMonth() + 1,
            find.getDate()
        ];
        const startDate = [
            start.getFullYear(),
            start.getMonth() + 1,
            start.getDate()
        ];

        if (start > find) return { error: 'Find date is less than start date!' };

        const totalDays = findDays(startDate, findDate);
        const correction = convertDayOfWeek(start.getDay());
        const dayOfWeek = getDayOfWeekName[convertDayOfWeek(find.getDay())];
        const weeks = Math.floor((totalDays + correction) / 7) + 1;
        const week = weeks % 2 === 0 ? 2 : 1;

        return {
            currentSemester: calculateSemester(find.getMonth() + 1),
            totalDays: totalDays + 1,
            currentWeek: week,
            currentDetailWeek: weeks,
            currentDay: dayOfWeek
        };
    },
    generateRandomTimeSlot,
    getISOWeekNumber,
    getISOWeekYear,
    getISOWeekMonday,
    nextEventOccurrence,
    isoWeeksInRange,
    calculateMiddleTimestamp
};
