const { Schema, model } = require('mongoose');
const { weekEnum, eventEnum } = require('../constant');

const EventDateSchema = new Schema({
    countWeek: { type: String, require: true },
    day: {
        type: String,
        enum: Object.values(weekEnum),
        default: weekEnum.MONDAY,
        require: true
    },
    time: {
        type: String,
        default: eventEnum.event1,
        require: true
    },
    duration: {
        type: Number,
        default: 30,
        require: true
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
