const { Schema, model } = require('mongoose');
const { verificateTokenEnum, userRoleEnum } = require('../constant');
const groupModel = require('./group.model');
const { VERIFIED_TYPE } = require('../constant/type/verificateToken.enum');
const userModel = require('./user.model');

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

verificateSchema.index({ user: 1, group: 1 });

module.exports = model('Verificate', verificateSchema);
