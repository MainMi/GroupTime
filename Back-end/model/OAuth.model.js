const { Schema, model } = require('mongoose');

const OAuthSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId, index: true, required: true, ref: 'User'
    },
    access_token: {
        type: String, unique: true, index: true, required: true
    },
    refresh_token: {
        type: String, unique: true, index: true, required: true
    },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

OAuthSchema.pre(/^find/, function(next) {
    this.populate({
        path: 'userId',
        select: '-password',
    });
    next();
});

// TTL: an OAuth session row is useless once the refresh token (30d) has expired,
// so reap it automatically instead of letting dead tokens accumulate forever.
OAuthSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = model('OAuth', OAuthSchema);
