const { API_SCHEDULE } = require('../../config/config');
const { getApi } = require('../../helper');

module.exports = {
    defaultSchedule: async (req, res) => {
        res.json(await getApi.getUrl(API_SCHEDULE));
    },
};
