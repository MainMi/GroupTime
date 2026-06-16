const { Schema, model } = require('mongoose');
const { SESSION_DURATION } = require('../constant/message.enum');

const SessionSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    startedAt: { type: Date, default: Date.now },
    endedAt: { type: Date, default: () => new Date(Date.now() + SESSION_DURATION) },
    isActive: { type: Boolean, default: true },
    messages: [{ type: Schema.Types.ObjectId, ref: 'Message' }]
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

SessionSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'messages',
        select: '-userId -sessionId'
    });
    next();
});

module.exports = model('Session', SessionSchema);
