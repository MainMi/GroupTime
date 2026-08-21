const { SEARCH_REGEX_OR_FN } = require('../constant/regex.enum');
const ApiError = require('../error/ErrorHandler');
const { USERS_NOT_FOUND } = require('../error/errorMsg');
const { NICKNAME_MAX_BASE_LENGTH, NICKNAME_SUFFIX_ATTEMPTS } = require('../constant/user.enum');
const userModel = require('../model/user.model');
const tokenCacheService = require('./tokenCache.service');

module.exports = {
    createUser: (user) => userModel.create(user),
    getUsers: () => userModel.find().lean(),
    getUsersById: (usersId) => userModel.find({ _id: { $in: usersId } }),
    getUser: (userData) => userModel.findOne(userData).lean(),
    getUserDoc: (userData) => userModel.findOne(userData),
    // Build a unique nickname from an email's local-part, appending a short random
    // suffix if the base is already taken. General-purpose (e.g. Google sign-up).
    getUniqueNickname: async (email) => {
        const base = (email.split('@')[0] || 'user').replace(/[^a-zA-Z0-9_]/g, '').slice(0, NICKNAME_MAX_BASE_LENGTH) || 'user';
        let nickname = base;
        for (let i = 0; i < NICKNAME_SUFFIX_ATTEMPTS; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            const existing = await userModel.findOne({ nickname }).lean();
            if (!existing) return nickname;
            nickname = `${base}_${Math.random().toString(36).slice(2, 6)}`;
        }
        return `${base}_${Date.now().toString(36)}`;
    },
    // Auth-cache invalidation happens in the user model's findOneAndUpdate hook.
    updateUser: (userId, newData) => userModel.findByIdAndUpdate(userId, { $set: newData }),
    // updateMany bypasses the model hook — invalidate explicitly.
    updateUsers: (userIds, newData) => userModel.updateMany(
        { _id: { $in: userIds } },
        newData
    ).then((res) => { userIds.forEach((id) => tokenCacheService.invalidateUser(id)); return res; }),
    getUsersQuery: async (queryData) => {
        const {
            limit = 20,
            page = 1,
        } = queryData;
        let { text } = queryData;

        if (!text || text.trim().length < 3) {
            throw new ApiError(...Object.values(USERS_NOT_FOUND));
        }
        const textArr = text.split(' ');
        if (textArr.length > 1) {
            text = SEARCH_REGEX_OR_FN(textArr);
        }

        const filterObject = {
            $or: [
                { nickname: { $regex: text, $options: 'i' } },
                { firstName: { $regex: text, $options: 'i' } },
                { lastName: { $regex: text, $options: 'i' } }
            ],
        };

        const skip = limit * (page - 1);

        const users = await userModel
            .find(filterObject)
            .select('nickname firstName lastName groupCount _id')
            .limit(limit)
            .skip(skip);

        const usersWithGroupsCount = users.map((user) => ({
            id: user._id,
            nickname: user.nickname,
            fullName: `${user.firstName} ${user.lastName}`.trim(),
            groupCount: user.groupCount
        }));

        const count = await userModel.countDocuments(filterObject);

        return {
            page,
            perPage: limit,
            data: usersWithGroupsCount,
            count
        };
    },
    populateGroupsDetail: (user) => user.populate([
        // The user's own picture + photo buffer (shown on the profile page).
        { path: 'avatar', select: 'location' },
        { path: 'avatarGallery', select: 'location' },
        {
            path: 'groups',
            populate: [
                {
                    path: 'group',
                    select: {
                        avatar: 1,
                        avatarGallery: 1,
                        role: 1,
                        name: 1,
                        description: 1,
                        type: 1,
                        parameters: 1,
                        users: 1,
                        userCount: 1,
                        _id: 1,
                    },
                    populate: [
                        { path: 'avatar', select: 'location' },
                        { path: 'avatarGallery', select: 'location' }
                    ]
                },
                {
                    path: 'user',
                    select: {
                        fullName: 1,
                        lastName: 1,
                        firstName: 1,
                        nickname: 1,
                        email: 1,
                        _id: 1,
                        createdAt: 1,
                        updatedAt: 1,
                    }
                }
            ]
        }
    ])
};
//         this.populate('user', {
//             fullName: 1,
//             lastName: 1,
//             firstName: 1,
//             email: 1,
//             _id: 1,
//             groups: 0,
//             avatar: 0,
//             createdAt: 1,
//             updatedAt: 1,
//         });
//         next();
//     })
//     .pre(/^find/, function(next) {
//         this.populate('group', {
//             avatar: 1,
//             role: 1,
//             name: 1,
//             description: 1,
//             type: 1,
//             userCount: { $size: '$users' },
//             users: 1,
//             parameters: 1,
//             _id: 1,
//         });
//         next();
//     })
//     .pre(/^find/, function(next) {
//         this.populate('group.users', {
//             fullName: 1,
//             lastName: 1,
//             firstName: 1,
//             email: 1,
//             _id: 1,
//             groups: 0,
//             avatar: 0,
//             createdAt: 1,
//             updatedAt: 1,
//         });
