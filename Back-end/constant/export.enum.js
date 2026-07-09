module.exports = {
    // How many weeks ahead of "now" the .ics feed expands recurring/static and
    // dynamic events. Calendar apps re-fetch subscriptions periodically, so this
    // rolling window stays fresh without emitting an unbounded calendar.
    CALENDAR_WEEKS_AHEAD: 20,
    // iCalendar PRODID (RFC 5545) identifying the generator.
    CALENDAR_PRODID: '-//GroupTime//Schedule//EN',
    // Length of the per-group subscription token (nanoid).
    CALENDAR_TOKEN_SIZE: 24,
};
