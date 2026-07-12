const { rsvpService } = require('../service/schedule');

module.exports = {
    // Record the caller's attendance response, then return the fresh summary so the
    // client updates counts and the highlighted choice in one round-trip.
    setRsvp: async (req, res, next) => {
        try {
            const { groupId, eventInfoId, status } = req.body;
            await rsvpService.setRsvp(req.authUser._id, { groupId, eventInfoId, status });
            const summary = await rsvpService.getSummary(eventInfoId, req.authUser._id);
            res.json(summary);
        } catch (e) {
            next(e);
        }
    },

    getRsvp: async (req, res, next) => {
        try {
            const summary = await rsvpService.getSummary(req.body.eventInfoId, req.authUser._id);
            res.json(summary);
        } catch (e) {
            next(e);
        }
    },
};
