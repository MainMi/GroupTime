const { Schema, model } = require('mongoose');
const { verificateTokenEnum, userRoleEnum } = require('../constant');
const groupModel = require('./group.model');
const { VERIFIED_TYPE } = require('../constant/type/verificateToken.enum');
const userModel = require('./user.model');
const tokenCacheService = require('../service/tokenCache.service');

// Membership mutations (join / leave / role change) invalidate the affected
// user's cached auth entries (their groups/roles changed) and the group's
// members' entries (embedded user lists/counts changed).
const invalidateMembership = (doc) => {
    if (!doc) return;
    tokenCacheService.invalidateUser(doc.user);
    tokenCacheService.invalidateGroup(doc.group);
};

const verificateSchema = new Schema({
    group: { type: Schema.Types.ObjectId, required: true, ref: 'Group' },
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    role: { type: String, enum: Object.values(userRoleEnum), default: userRoleEnum.USER },
    type: { type: String, enum: Object.values(verificateTokenEnum) },
    actionToken: { type: String },
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

verificateSchema.pre('save', async function(next) {
    if (this.isNew && this.type === VERIFIED_TYPE) {
        await groupModel.findByIdAndUpdate(this.group, { $inc: { userCount: 1 } });
        await userModel.findByIdAndUpdate(this.user, { $inc: { groupCount: 1 } });
    }
    next();
});

verificateSchema.pre('findOneAndUpdate', async function(next) {
    const update = this.getUpdate();

    if (update.$set && update.$set.type === VERIFIED_TYPE) {
        const previousDoc = await this.model.findOne(this.getQuery()).lean();

        if (previousDoc && previousDoc.type !== VERIFIED_TYPE) {
            await groupModel.findByIdAndUpdate(previousDoc.group, { $inc: { userCount: 1 } });
            await userModel.findByIdAndUpdate(previousDoc.user, { $inc: { groupCount: 1 } });
        }
    }

    next();
});

verificateSchema.pre('findOneAndDelete', async function(next) {
    const doc = await this.model.findOne(this.getQuery()).lean();

    if (doc && doc.type === VERIFIED_TYPE) {
        await groupModel.findByIdAndUpdate(doc.group, { $inc: { userCount: -1 } });
        await userModel.findByIdAndUpdate(doc.user, { $inc: { groupCount: -1 } });
    }

    await groupModel.findByIdAndUpdate(doc.group, {
        $pull: { users: doc._id }
    });

    await userModel.findByIdAndUpdate(doc.user, {
        $pull: { groups: doc._id }
    });

    next();
});

verificateSchema.post('save', function() {
    invalidateMembership(this);
});
verificateSchema.post('findOneAndUpdate', invalidateMembership);
verificateSchema.post('findOneAndDelete', invalidateMembership);

// deleteMany has no doc in its hooks — capture the affected memberships first
// (rare path: group deletion cascade).
verificateSchema.pre('deleteMany', async function(next) {
    this._affectedMemberships = await this.model
        .find(this.getQuery())
        .select('user group')
        .lean();
    next();
});
verificateSchema.post('deleteMany', function() {
    (this._affectedMemberships || []).forEach(invalidateMembership);
});

// One membership per (user, group). Unique so duplicates can't reappear — run the
// schema-consistency migration first to clear any pre-existing duplicates.
verificateSchema.index({ user: 1, group: 1 }, { unique: true });

module.exports = model('Verificate', verificateSchema);
