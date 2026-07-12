// Attendance responses a member can give to an event.
const RSVP_STATUS = {
    GOING: 'going',
    MAYBE: 'maybe',
    DECLINED: 'declined',
};

module.exports = {
    RSVP_STATUS,
    RSVP_STATUSES: Object.values(RSVP_STATUS), // ['going','maybe','declined']
    // Sent by the client to clear an existing response (toggle off).
    RSVP_NONE: 'none',
};
