const sessionModel = require('../../model/session.model');

module.exports = {
    createSession: (data) => sessionModel.create(data),
    updateSession: (queryData, newData) => sessionModel
        .findOneAndUpdate(queryData, { $set: newData }),
    updateMessages: (sessionId, msgDataArray) => sessionModel.findOneAndUpdate(
        { _id: sessionId },
        {
            $push: {
                messages: {
                    $each: msgDataArray,
                }
            }
        },
        { new: true }
    ),
    findSession: (data) => sessionModel.findOne(data).lean(),
    deleteSession: (queryData) => sessionModel.findOneAndDelete(queryData),
    deleteSessions: (queryData) => sessionModel.deleteMany(queryData),
};
