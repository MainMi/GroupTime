const weekEnum = require('./week.enum');

module.exports = {
    // A fresh week: every weekday present with an empty events list.
    BASIC_SCHEDULE: Array.from(Object.values(weekEnum), (day) => ({ day, events: [] })),
};
