const { STUDENT_ROLE, HELP_ADMIN_ROLE, ADMIN_ROLE } = require('./user.role.enum');
const weekEnum = require('./week.enum');

module.exports = {
    CURRENT_YEAR: new Date().getFullYear(),
    CURRENT_MONTH: new Date().getMonth(),
    BASIC_ROLE_USER: [
        STUDENT_ROLE,
        HELP_ADMIN_ROLE,
        ADMIN_ROLE
    ],
    BASIC_SCHEDULE: Array.from(Object.values(weekEnum), (day) => ({ day, events: [] })),
    MAX_USER_GROUPS: 5,
};
