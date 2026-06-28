const { API_SCHEDULE } = require('../../config/config');
const { getApi } = require('../../helper');

module.exports = {
    // Fetch the external default schedule payload. A service returns data — the
    // controller is responsible for the request/response.
    getDefaultSchedule: () => getApi.getUrl(API_SCHEDULE),
};
