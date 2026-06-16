const axios = require('axios');

const config = {
    method: 'GET',
    url: '',
    headers: {
        'Accept-Encoding': 'application/json'
    }
};

module.exports = {
    getUrl: async (url) => {
        const data = await axios.request({ ...config, url }).then((response) => response.data);
        return data;
    }
};
