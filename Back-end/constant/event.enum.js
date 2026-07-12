module.exports = {
    event1: '8:30',
    event2: '10:25',
    event3: '12:20',
    event4: '14:15',
    event5: '16:10',
    event6: '18:30',
    // Max attachments allowed per event (eventDate.data).
    MAX_EVENT_FILES: 5,
    // Fallback length (minutes) when an event is created without an explicit one.
    DEFAULT_EVENT_DURATION: 90,
    // Type stamped on events created via the .ics import.
    IMPORTED_EVENT_TYPE: 'Imported',
    // Fallback name when an imported VEVENT has no SUMMARY.
    IMPORTED_EVENT_NAME: 'Imported event',
    // Hard cap per .ics import request — each event costs several DB writes.
    MAX_IMPORT_EVENTS: 300,
    // Hard cap on occurrences created from one recurring-event request (~1 year weekly).
    MAX_RECURRING_OCCURRENCES: 60,
};
