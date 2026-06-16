const { Schema, model } = require('mongoose');

const ActionTokenTypeSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId, required: true, ref: 'User', index: true
    },
    groupId: {
        type: Schema.Types.ObjectId, ref: 'Group', index: true
    },
    action_token: {
        type: String, trim: true, unique: true, required: true, index: true
    },
    action_type: {
        type: String, trim: true, lowercase: true, required: true, index: true
    },
}, { timestamps: true });

module.exports = model('Action_Token', ActionTokenTypeSchema);
