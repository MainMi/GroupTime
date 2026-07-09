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

// Equality on { groupId, static } with a sort/range on countWeek — this ordering
// (sort field last) serves findStaticWeekByIndex's sort+skip, findDynamicWeekByCountWeek,
// countDocuments({ groupId, static }) and the equality lookups (findWeek/addEvent) as
// index scans. The old { groupId, countWeek, static } ordering was fully covered by
// this one and has been removed — drop it manually in Atlas (Mongoose won't).
ScheduleWeekSchema.index({ groupId: 1, static: 1, countWeek: 1 });

module.exports = model('ScheduleWeek', ScheduleWeekSchema);
