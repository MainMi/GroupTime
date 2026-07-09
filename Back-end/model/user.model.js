const { Schema, model } = require('mongoose');
const { userRoleEnum } = require('../constant');
const tokenCacheService = require('../service/tokenCache.service');

const UserSchema = new Schema({
    nickname: {
        type: String,
        trim: true,
        required: true,
        unique: true // `unique` already creates the index — no separate `index: true`.
    },
    firstName: {
        type: String,
        trim: true,
        index: true,
        required: true
    },
    lastName: {
        type: String,
        trim: true,
        index: true,
        required: true
    },
    email: {
        type: String,
        trim: true,
        required: true,
        unique: true
    },
    // Optional: Google-authenticated users have no local password, and may not
    // supply a birthday at sign-up (they can fill it in on their profile later).
    password: { type: String, required: false, select: false },
    birthday: { type: Date, required: false },
    // Set for users who signed in with Google (provider 'google'); links the
    // Google account so subsequent logins match the same user.
    googleId: { type: String, index: true, sparse: true },
    authProvider: {
        type: String,
        enum: [
            'local',
            'google'
        ],
        default: 'local'
    },
    global_role: { type: String, enum: Object.values(userRoleEnum), default: userRoleEnum.USER },
    groups: [{ type: Schema.Types.ObjectId, ref: 'Verificate', index: true }],
    groupCount: { type: Number, default: 0 },
    avatar: { type: Schema.Types.ObjectId, ref: 'File', default: null },
    // Up to MAX_AVATAR_GALLERY recently-uploaded pictures the user can switch between.
    avatarGallery: [{ type: Schema.Types.ObjectId, ref: 'File' }],
    authorized: { type: Boolean, default: false },
    // Whether the user finished the whole in-app onboarding tour (all sections).
    // Synced from the frontend so tours don't reappear on other devices.
    tourCompleted: { type: Boolean, default: false },
    // Display timezone as a GMT offset in hours (-12..14). Schedule times are
    // stored in the group's timezone (group.parameters.gmt) and shifted by
    // (user.gmt - group.gmt) for display.
    gmt: { type: Number, default: 0 },
    // Telegram chat id set by the (gitignored) bot after the user links their
    // account via the /start deep-link. Presence = reminders can go to Telegram.
    telegramChatId: { type: String, default: '' },
    phone: { type: String, default: '' },
    contacts: {
        Github: { type: String, default: '' },
        Instagram: { type: String, default: '' },
        Telegram: { type: String, default: '' }
    }
}, {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true }
});

UserSchema.virtual('fullName').get(function() {
    return `${this.firstName} ${this.lastName}`.trim();
});

// Any user write (profile edit, avatar, group/count sync from Verificate hooks)
// drops the user's cached auth entries so the change is visible on the next
// request. Centralized here so callers can't forget it. NOTE: updateMany
// bypasses this hook — its callers invalidate explicitly (see user.service).
UserSchema.post('findOneAndUpdate', (doc) => {
    if (doc) tokenCacheService.invalidateUser(doc._id);
});

// UserSchema.pre(/^find/, function(next) {
//     this.populate({
//         path: 'groups',
//         select: '-actionToken'
//     });
//     this.populate('avatar');
//     next();
// });

module.exports = model('User', UserSchema);
