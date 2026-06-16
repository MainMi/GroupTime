const cron = require('node-cron');

const removeObjCron = require('./removeObj.cron');

module.exports = () => {
    cron.schedule('0 0 1 * *', removeObjCron);
};
