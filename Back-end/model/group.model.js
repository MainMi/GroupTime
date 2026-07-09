const { Schema, model } = require('mongoose');
const { groupTypesEnum } = require('../constant');
const tokenCacheService = require('../service/tokenCache.service');
const { BASIC_ROLE_USER } = require('../constant/group.enum');
const { ADMIN_ROLE } = require('../constant/user.role.enum');

const ParametersSchema = new Schema({
    usersLimit: { type: Number, default: 50 },
    createEventInfosRole: { type: String, enum: Object.values(BASIC_ROLE_USER), default: ADMIN_ROLE },
    // Minimum group role allowed to run assistant write-commands (/magic, /organizer)
    // and, by extension, to create/edit/delete schedule events. Defaults to admin.
    assistantCommandRole: { type: String, enum: Object.values(BASIC_ROLE_USER), default: ADMIN_ROLE },
    notifacionFromEmail: { type: Boolean, default: true },
    // Visible time range of the schedule table (e.g. '8:00'–'21:00').
    periodStartEvent: { type: String, default: '8:00' },
    periodEndEvent: { type: String, default: '21:00' },
    // Timezone the group's schedule times are stored in, as a GMT offset in
    // hours. Display shifts times by (user.gmt - this) per viewer.
    gmt: { type: Number, default: 0 }
});

const GroupSchema = new Schema({
    avatar: { type: Schema.Types.ObjectId, ref: 'File', default: null },
    // Up to MAX_AVATAR_GALLERY recently-uploaded pictures the group can switch between.
    avatarGallery: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    name: { type: String, required: true },
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
    // Always materialise the sub-document so EVERY parameter (including newer ones
    // like assistantCommandRole / period*) gets its schema default — the previous
    // hard-coded default object silently omitted them.
    parameters: {
        type: ParametersSchema,
        default: () => ({})
    },
    userCount: { type: Number, default: 0 },
    // Opaque token embedded in the group's .ics subscription URL. Absent until a
    // member first requests the link; regenerating it revokes existing feeds.
    calendarToken: { type: String, index: true, sparse: true }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

GroupSchema.index({ name: 'text' });

// Cached authUsers embed group details (incl. `parameters` used for
// authorization) — any group write evicts exactly the members' cached entries.
// Centralized here so edit/avatar/membership paths can't forget it.
GroupSchema.post('findOneAndUpdate', (doc) => {
    if (doc) tokenCacheService.invalidateGroup(doc._id);
});
GroupSchema.post('findOneAndDelete', (doc) => {
    if (doc) tokenCacheService.invalidateGroup(doc._id);
});

module.exports = model('Group', GroupSchema);
