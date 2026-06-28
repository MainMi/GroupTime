// Truly app-wide cross-cutting values only. Domain-specific constants live in
// their own domain files (group.enum, schedule.enum, event.enum, avatar.enum…).
module.exports = {
    CURRENT_YEAR: new Date().getFullYear(),
    CURRENT_MONTH: new Date().getMonth(),
};
