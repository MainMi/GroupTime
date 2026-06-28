// General time utilities: convert between an "H:MM" string and minutes since
// midnight. Reusable anywhere time math is needed (analyzer, validators, …).
const parseTimeToMinutes = (time) => {
    if (typeof time !== 'string') return null;
    const m = time.match(/(\d{1,2})[:.](\d{2})/);
    if (!m) return null;
    return Number(m[1]) * 60 + Number(m[2]);
};

const minutesToTime = (mins) => `${Math.floor(mins / 60)}:${String(mins % 60).padStart(2, '0')}`;

module.exports = {
    parseTimeToMinutes,
    minutesToTime,
};
