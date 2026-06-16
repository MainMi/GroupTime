const { Schema, model } = require('mongoose');

const EventInfosSchema = new Schema({
    teacherName: { type: String },
    name: { type: String, require: true },
    type: { type: String },
    // Color bound to the event type (hex). Rendered in the schedule grid.
    color: { type: String },
    place: { type: String },
    platform: { type: String },
    link: { type: String },
    tag: { type: [String], default: [] },
    description: { type: String },
});

EventInfosSchema.index({ name: 'text', tag: 'text' });

module.exports = model('eventInfo', EventInfosSchema);
