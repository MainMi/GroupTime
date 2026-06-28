const { Schema, model } = require('mongoose');
const { weekEnum, eventEnum } = require('../constant');

const EventDateSchema = new Schema({
    // Number to stay consistent with ScheduleWeek.countWeek (also a Number); the
    // previous String type made every `countWeek !== n` comparison in editEvent
    // true and forced a needless delete+re-add on each edit.
    countWeek: { type: Number, required: true },
    day: {
        type: String,
        enum: Object.values(weekEnum),
        default: weekEnum.MONDAY,
        required: true
    },
    time: {
        type: String,
        default: eventEnum.event1,
        required: true
    },
    duration: {
        type: Number,
        default: 30,
        required: true
    },
    data: [{ type: Schema.Types.ObjectId, ref: 'File' }]
});

EventDateSchema.index({ countWeek: 1, day: 1, time: 1 });

EventDateSchema
    .pre(/^find/, function(next) {
        this.populate('data');
        next();
    });

module.exports = model('eventDate', EventDateSchema);
