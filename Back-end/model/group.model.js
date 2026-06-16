const { Schema, model } = require('mongoose');
const { groupTypesEnum } = require('../constant');
const { BASIC_ROLE_USER } = require('../constant/constants.enum');
const { ADMIN_ROLE } = require('../constant/user.role.enum');

const ParametersSchema = new Schema({
    usersLimit: { type: Number, default: 50 },
    createEventInfosRole: { type: String, enum: Object.values(BASIC_ROLE_USER), default: ADMIN_ROLE },
    notifacionFromEmail: { type: Boolean, default: true },
    // Visible time range of the schedule table (e.g. '8:00'–'21:00').
    periodStartEvent: { type: String, default: '8:00' },
    periodEndEvent: { type: String, default: '21:00' }
});

const GroupSchema = new Schema({
    avatar: { type: Schema.Types.ObjectId, ref: 'File', default: null },
    // Up to MAX_AVATAR_GALLERY recently-uploaded pictures the group can switch between.
    avatarGallery: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    name: { type: String, require: true },
    description: { type: String, default: '' },
    schedule: {
        static: [{ type: Schema.Types.ObjectId, ref: 'ScheduleWeek', index: true }],
        current: [{ type: Schema.Types.ObjectId, ref: 'ScheduleWeek', index: true }],
    },
    users: [{ type: Schema.Types.ObjectId, ref: 'Verificate', index: true }],
    type: {
        type: String,
        enum: Object.values(groupTypesEnum),
        default: groupTypesEnum.PRIVATE_TYPE
    },
    parameters: {
        type: ParametersSchema,
        default: {
            usersLimit: 50,
            createEventInfosRole: ADMIN_ROLE,
            notifacionFromEmail: true
        }
    },
    userCount: { type: Number, default: 0 }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

GroupSchema.index({ name: 'text' });

module.exports = model('Group', GroupSchema);
