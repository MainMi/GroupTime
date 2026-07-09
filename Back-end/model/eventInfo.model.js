const { Schema, model } = require('mongoose');

const EventInfosSchema = new Schema({
    teacherName: { type: String },
    name: { type: String, required: true },
    type: { type: String },
    // Color bound to the event type (hex). Rendered in the schedule grid.
    color: { type: String },
    place: { type: String },
    platform: { type: String },
    link: { type: String },
    tag: { type: [String], default: [] },
    description: { type: String },
    // Author of the event (null for events created before this field existed).
    createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
    // Idempotency key for .ics imports: `${groupId}:${VEVENT UID}:${start}`.
    // Re-importing the same calendar skips events whose key already exists.
    importUid: { type: String },
});

EventInfosSchema.index({ name: 'text', tag: 'text' });
EventInfosSchema.index({ importUid: 1 }, { sparse: true });

module.exports = model('eventInfo', EventInfosSchema);
