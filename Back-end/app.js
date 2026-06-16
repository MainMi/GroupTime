const express = require('express');
const cors = require('cors');

const path = require('path');
const fileUpload = require('express-fileupload');
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./documention/swagger.json');

global.rootPath = __dirname;

const { MAX_SUPPORT_SIZE } = require('./constant/type/fileSize.enum');

const apiRouter = require('./router/api.router');

const app = express();

app.use(cors());

app.use(express.json());

app.use(express.urlencoded({ extended: true }));

app.use(
    fileUpload({
        limits: MAX_SUPPORT_SIZE,
    })
);

if (process.env.NODE_ENV !== 'test') {
    const mongoose = require('mongoose');
    const { MONGODB_URL } = require('./config/config');
    mongoose
        .set('debug', process.env.NODE_ENV === 'development')
        .set('strictQuery', true)
        .connect(MONGODB_URL)
        .catch((error) => {
            console.error(error.message);
            process.exit(1);
        });
}

app.use('/api/docs', swaggerUI.serve, swaggerUI.setup(swaggerDocument));

app.use('/api', apiRouter);

app.use(_mainErrorHandler);

app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, '/view')));

// eslint-disable-next-line no-unused-vars
function _mainErrorHandler(err, req, res, next) {
    const { NODE_ENV } = process.env;
    if (NODE_ENV !== 'test' || NODE_ENV === 'test-dev') {
        console.error(err);
    }
    res.status(err.status || 500).json({
        status: err.status || 500,
        errorStatus: err.errorStatus || 0,
        message: err.message || '',
    });
}
module.exports = app;
