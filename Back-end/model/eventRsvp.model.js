const { Schema, model } = require('mongoose');
const { RSVP_STATUSES } = require('../constant/rsvp.enum');

// One member's attendance response ("going / maybe / declined") to one event.
// Keyed by EventInfo, so it follows a static (recurring) event across weeks and a
// dynamic event for its single occurrence — matching how reminders key off the
// event too.
const EventRsvpSchema = new Schema({
    eventInfo: {
        type: Schema.Types.ObjectId, ref: 'eventInfo', required: true, index: true,
    },
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    group: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    status: { type: String, enum: RSVP_STATUSES, required: true },
}, { timestamps: true });

// One response per (event, user); re-answering updates it in place.
EventRsvpSchema.index({ eventInfo: 1, user: 1 }, { unique: true });

module.exports = model('EventRsvp', EventRsvpSchema);
