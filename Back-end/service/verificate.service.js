const verificateModel = require('../model/verificateModel');

// Auth-cache invalidation for membership mutations lives in the model's hooks
// (see verificateModel), so every write path — including cascades — is covered.
module.exports = {
    createVerificateUser: (userData) => verificateModel.create(userData),
    updateVerificateUser: (queryData, newData) => verificateModel
        .findOneAndUpdate(queryData, newData),
    findVerificateUser: (userData) => verificateModel.findOne(userData).lean(),
    findVerificateUsers: (userData) => verificateModel.find(userData).lean(),
    deleteVerificateUser: (queryData) => verificateModel.findOneAndDelete(queryData),
    deleteVerificateUsers: (queryData) => verificateModel.deleteMany(queryData),
};
