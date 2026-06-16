const currentYear = new Date().getFullYear()

const calendarEnum = {
    weeksArr: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    weekFullArr: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    monthArr: [
        'January', 'February', 'March', 'April', 'May', 'June', 
        'July', 'August', 'September', 'October', 'November', 'December'
    ],
    shortMonthArr: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
    ],
    currentYear,
    minBirthdayYear: currentYear - 100,
    maxBirthdayYear: currentYear - 14,
    TS: 30,
    MTD: 2 // Max Timesheet Duration = (MTD + 1) * TS 
};

export default calendarEnum;
