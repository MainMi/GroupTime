const dayJs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const OAuthModel = require('../model/OAuth.model');

dayJs.extend(utc);

module.exports = async () => {
    const oneMounthBeforeNow = dayJs().utc().subtract(1, 'months');

    await OAuthModel.deleteMany({ createdAt: { $lte: oneMounthBeforeNow } });
};
