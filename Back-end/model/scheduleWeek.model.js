const { Schema, model } = require('mongoose');
const { weekEnum } = require('../constant');

const ScheduleWeekSchema = new Schema({
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    countWeek: { type: Number },
    static: { type: Boolean, default: true },
    schedule: [{
        day: {
            type: String,
            enum: Object.values(weekEnum),
            require: true
        },
        events: [{
            eventInfo: { type: Schema.Types.ObjectId, ref: 'eventInfo', index: true },
            eventDate: { type: Schema.Types.ObjectId, ref: 'eventDate', index: true }
        }]
    }]
}, {
    // `updatedAt` is used as a lightweight cache version: the frontend compares it
    // to its cached copy and only re-fetches the full week when it changed.
    timestamps: true
});

ScheduleWeekSchema.index({ groupId: 1, countWeek: 1, static: 1 });

module.exports = model('ScheduleWeek', ScheduleWeekSchema);
