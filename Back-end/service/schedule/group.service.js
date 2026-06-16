const { STRONG_PRIVATE_TYPE } = require('../../constant/type/groupTypes.enum');
const groupModel = require('../../model/group.model');

module.exports = {
    getAllGroup: () => groupModel.find({}),
    getGroupById: (groupId) => groupModel.findById(groupId).populate({
        path: 'users',
        select: '-groups'
    }).populate('avatar', 'location').populate('avatarGallery', 'location'),
    getGroupByName: (name) => groupModel.findOne({ name }).populate({
        path: 'users',
        select: '-groups'
    }).populate('avatar', 'location').populate('avatarGallery', 'location'),
    createGroup: (groupObject) => groupModel.create(groupObject),
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
            type: { $ne: STRONG_PRIVATE_TYPE }
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
