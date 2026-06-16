const { Schema, model } = require('mongoose');
const { messageTypeEnum } = require('../constant');

const MessageSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    content: { type: String, required: true },
    type: { type: String, enum: Object.values(messageTypeEnum), required: true },
    timestamp: { type: Date, default: Date.now },
    sessionId: { type: String, required: true },
}, {
    timeseries: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

module.exports = model('Message', MessageSchema);
