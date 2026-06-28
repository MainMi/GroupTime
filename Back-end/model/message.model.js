const { Schema, model } = require('mongoose');
const { messageTypeEnum } = require('../constant');

const MessageSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: Object.values(messageTypeEnum), required: true },
    timestamp: { type: Date, default: Date.now },
    sessionId: { type: Schema.Types.ObjectId, ref: 'Session', required: true },
}, {
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

// History is read per-user, newest first (messageService.findsMessages); and
// occasionally scoped to a session.
MessageSchema.index({ userId: 1, timestamp: -1 });
MessageSchema.index({ sessionId: 1 });

module.exports = model('Message', MessageSchema);
