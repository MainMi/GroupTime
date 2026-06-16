const { API_SCHEDULE } = require('../config/config');
const { getApi } = require('../helper');
// const groupModel = require('../model/group.model');

module.exports = {
    _uploadAllGroup: async () => {
        const dataGroup = await getApi.getUrl(`${API_SCHEDULE}groups`);
        const { data } = dataGroup;
        data.map((value) => {
            value.groupId = value.id;
            return value;
        });
        return data;
    },
    _uploadAllLecture: async () => {
        const dataGroup = await getApi.getUrl(`${API_SCHEDULE}lecturer/list`);
        const { data } = dataGroup;
        data.map((value) => {
            value.lectureId = value.id;
            return value;
        });
        return data;
    },
};
