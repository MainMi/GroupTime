const messageModel = require('../../model/message.model');

module.exports = {
    createMessage: (data) => messageModel.create(data),
    createMessages: (data) => messageModel.insertMany(data),
    updateMessage: (queryData, newData) => messageModel
        .findOneAndUpdate(queryData, { $set: newData }),
    findMessage: (data) => messageModel.findOne(data).lean(),
    findsMessages: (userId, limit = 50, page = 1) => messageModel.find({ userId })
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ timestamp: -1 }),
    deleteMessage: (queryData) => messageModel.findOneAndDelete(queryData),
    deleteMessages: (queryData) => messageModel.deleteMany(queryData),
};
