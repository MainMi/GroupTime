const { STRONG_PRIVATE_TYPE, PERSONAL_TYPE } = require('../../constant/type/groupTypes.enum');
const { ADMIN_ROLE, OWNER_ROLE } = require('../../constant/user.role.enum');
const groupModel = require('../../model/group.model');
const verificateService = require('../verificate.service');
const userService = require('../user.service');

module.exports = {
    getAllGroup: () => groupModel.find({}),

    // Resolve the email of a group's owner (used for join notifications). Falls
    // back to an admin for legacy groups created before the owner role existed.
    findGroupOwnerEmail: async (groupId) => {
        const ownerVerificate = await verificateService.findVerificateUser({ group: groupId, role: OWNER_ROLE })
            || await verificateService.findVerificateUser({ group: groupId, role: ADMIN_ROLE });
        if (!ownerVerificate) return null;
        const owner = await userService.getUser({ _id: ownerVerificate.user });
        return owner?.email || null;
    },
    getGroupById: (groupId) => groupModel.findById(groupId).populate({
        path: 'users',
        select: '-groups'
    }).populate('avatar', 'location').populate('avatarGallery', 'location'),
    // Lightweight parameters-only lookup for permission checks (no heavy populate).
    getGroupParametersById: (groupId) => groupModel.findById(groupId).select('parameters'),
    getGroupByName: (name) => groupModel.findOne({ name }).populate({
        path: 'users',
        select: '-groups'
    }).populate('avatar', 'location').populate('avatarGallery', 'location'),
    createGroup: (groupObject) => groupModel.create(groupObject),
    // The user's personal schedule group, if any. Personal groups are single-owner
    // and one-per-user — createGroup uses this to stay idempotent for them.
    findUserPersonalGroup: async (userId) => {
        const memberships = await verificateService.findVerificateUsers({ user: userId });
        if (!memberships.length) return null;
        return groupModel.findOne({
            _id: { $in: memberships.map((m) => m.group) },
            type: PERSONAL_TYPE
        }).lean();
    },
    updateGroup: (groupId, newData) => groupModel.findByIdAndUpdate(
        groupId,
        { $set: newData },
        { new: true }
    ),
    updateUserGroup: (groupId, userData) => groupModel.findOneAndUpdate({ _id: groupId }, {
        $push: {
            users: userData
        }
    }).populate({
        path: 'users',
        select: '-groups'
    }),
    deleteGroup: (groupId) => groupModel.findByIdAndDelete(groupId),
    findGroups: async (queryData) => {
        const {
            query = '',
            groupId = null,
            limit = 20,
            page = 1
        } = queryData;

        const filter = groupId ? { _id: groupId } : {
            $or: [
                { name: { $regex: query, $options: 'i' } },
                { description: { $regex: query, $options: 'i' } }
            ],
            type: {
                $nin: [
                    STRONG_PRIVATE_TYPE,
                    PERSONAL_TYPE
                ]
            }
        };

        const count = await groupModel.countDocuments(filter);

        const skip = limit * (page - 1);

        const data = await groupModel.find(
            filter,
            {
                _id: 1,
                avatar: 1,
                name: 1,
                description: 1,
                type: 1,
                userCount: 1,
                parameters: 1,
            }
        )
            .populate('avatar', 'location')
            .limit(limit)
            .skip(skip)
            .lean();

        return {
            page,
            perPage: limit,
            count,
            data
        };
    }
};
