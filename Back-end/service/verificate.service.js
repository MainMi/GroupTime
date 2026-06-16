const verificateModel = require('../model/verificateModel');

module.exports = {
    createVerificateUser: (userData) => verificateModel.create(userData),
    updateVerificateUser: (queryData, newData) => verificateModel
        .findOneAndUpdate(queryData, newData),
    findVerificateUser: (userData) => verificateModel.findOne(userData).lean(),
    deleteVerificateUser: (queryData) => verificateModel.findOneAndDelete(queryData),
    deleteVerificateUsers: (queryData) => verificateModel.deleteMany(queryData),
};
