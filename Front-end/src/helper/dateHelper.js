import regex from "../constants/regex.enum";

export function roundTimeToInterval(timeStr, interval) {

    const [hoursStr, minutesStr] = timeStr.split(':');
    const hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);

    const totalMinutes = hours * 60 + minutes;

    const roundedMinutes = Math.floor(totalMinutes / interval) * interval;

    const roundedHours = Math.floor(roundedMinutes / 60);
    const roundedMins = roundedMinutes % 60;

    const formattedHours = String(roundedHours).padStart(2, '0');
    const formattedMinutes = String(roundedMins).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
}


export default function generateTimeArray(periodStart, periodEnd, stepMinutes) {

    if (typeof stepMinutes !== 'number' || isNaN(stepMinutes) || stepMinutes <= 0) {
        throw new Error(`stepMinutes can't be negative Your time: ${stepMinutes}`);
    }

    const timeStart = checkTime(periodStart);
    const timeEnd = checkTime(periodEnd);
    
    
    if (timeStart > timeEnd) {
        throw new Error(`periodStart (${periodStart}) cant be late that periodEnd (${periodEnd}).`);
    }

    const timeArray = [];
    let currentTime = timeStart;
    
    while (currentTime <= timeEnd) {
        timeArray.push(formatTime(currentTime));
        currentTime.setMinutes(currentTime.getMinutes() + stepMinutes);
    }


    return timeArray;
}

export function formatTime(date) {
    let hours = date.getHours();
    let minutes = date.getMinutes();
    
    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    
    return `${hours}:${minutes}`;
}

function checkTime(time) {
    const isValidTime = regex.TIME_REGEX.test(time);
    if (!isValidTime) {
        throw new Error(`time must contain time in format HH:MM or HH:MM:SS`);
    }

    const parts = time.split(':');
    const date = new Date();

    date.setHours(parseInt(parts[0], 10));
    date.setMinutes(parseInt(parts[1], 10));
    date.setSeconds(parts[2] ? parseInt(parts[2], 10) : 0);

    return date;
}

export function addTime(time, addMinutes) {
    let [hours, minutes] = time.split(':').map(Number);

    minutes += addMinutes;

    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;

    const formattedHours = String(hours).padStart(2, '0');
    const formattedMinutes = String(minutes).padStart(2, '0');

    return `${formattedHours}:${formattedMinutes}`;
}


// Minutes since midnight for an 'H:mm' / 'HH:mm' time string.
export function timeStringToMinutes(timeStr) {
    const [h, m] = String(timeStr || '0:0').split(':').map(Number);
    return (h || 0) * 60 + (m || 0);
}

// Return a copy of `date` set to local noon — avoids UTC-midnight day rollover
// (e.g. UTC+3 turning a midnight date into the previous day).
export function atNoon(date) {
    const d = new Date(date);
    d.setHours(12, 0, 0, 0);
    return d;
}

// Monday (local midnight) of the given ISO week in `year`. Uses the Jan-4 anchor
// (Jan 4 is always in ISO week 1).
export function getMondayOfISOWeek(isoWeek, year = new Date().getFullYear()) {
    const jan4 = new Date(year, 0, 4);
    const jan4JsDay = jan4.getDay() || 7;
    const mondayWeek1 = new Date(year, 0, 4 - (jan4JsDay - 1));
    const monday = new Date(mondayWeek1);
    monday.setDate(monday.getDate() + (isoWeek - 1) * 7);
    return monday;
}

export function getEventIntervals(event, timeSchedule, interval) {
    const eventStartMinutes = timeStringToMinutes(event.eventDate.time);
    const duration = event.eventDate.duration;
    const eventEndMinutes = eventStartMinutes + duration;

    const intervals = [];
    for (let i = 0; i < timeSchedule.length; i++) {
        const intervalStartMinutes = timeStringToMinutes(timeSchedule[i]);
        const intervalEndMinutes = intervalStartMinutes + interval;
        

        if (
            (eventStartMinutes >= intervalStartMinutes && eventStartMinutes < intervalEndMinutes) ||
            (eventEndMinutes > intervalStartMinutes && eventEndMinutes <= intervalEndMinutes) ||
            (eventStartMinutes <= intervalStartMinutes && eventEndMinutes >= intervalEndMinutes)
        ) {
            intervals.push(timeSchedule[i]);
        }
    }
    return intervals;
}

export const getISOWeekNumber = (d) => {
    d = new Date(d);
    d = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    d.setUTCDate(d.getUTCDate() + 4 - (d.getUTCDay() || 7));
    const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
    const weekNo = Math.ceil((((d - yearStart) / 86400000) + 1) / 7);
    return weekNo;
};
