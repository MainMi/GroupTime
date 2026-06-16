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
    timeseries: true,
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

module.exports = model('OAuth', OAuthSchema);
