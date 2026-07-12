const rsvpModel = require('../../model/eventRsvp.model');
const { RSVP_STATUS, RSVP_NONE } = require('../../constant/rsvp.enum');

module.exports = {
    // Set (or clear, when status is RSVP_NONE) the user's response to an event.
    // Idempotent via the unique (eventInfo, user) index.
    setRsvp: async (userId, { groupId, eventInfoId, status }) => {
        if (status === RSVP_NONE) {
            await rsvpModel.deleteOne({ eventInfo: eventInfoId, user: userId });
            return null;
        }
        return rsvpModel.findOneAndUpdate(
            { eventInfo: eventInfoId, user: userId },
            { $set: { group: groupId, status } },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
    },

    // Response counts for an event plus the caller's own response (RSVP_NONE if
    // they haven't answered). One query, computed in memory.
    getSummary: async (eventInfoId, userId) => {
        const rows = await rsvpModel.find({ eventInfo: eventInfoId }).select('user status').lean();
        const counts = {
            [RSVP_STATUS.GOING]: 0,
            [RSVP_STATUS.MAYBE]: 0,
            [RSVP_STATUS.DECLINED]: 0,
        };
        let myStatus = RSVP_NONE;
        rows.forEach((row) => {
            if (counts[row.status] != null) counts[row.status] += 1;
            if (String(row.user) === String(userId)) myStatus = row.status;
        });
        return { counts, myStatus, total: rows.length };
    },

    // Drop every response for an event (called when the event is deleted).
    deleteForEvent: (eventInfoId) => rsvpModel.deleteMany({ eventInfo: eventInfoId }),
};
