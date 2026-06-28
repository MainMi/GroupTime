const actionTokenModel = require('../model/actionToken.model');

module.exports = {
    createActionToken: (data) => actionTokenModel.create(data),
    findActionToken: (queryData) => actionTokenModel.findOne(queryData),
    deleteActionToken: (queryData) => actionTokenModel.findOneAndDelete(queryData),
};
