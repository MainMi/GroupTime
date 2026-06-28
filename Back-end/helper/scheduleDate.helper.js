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
    isoWeeksInRange,
    calculateMiddleTimestamp
};
