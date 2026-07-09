const express = require('express');
const cors = require('cors');

const path = require('path');
const fileUpload = require('express-fileupload');
const swaggerUI = require('swagger-ui-express');
const swaggerDocument = require('./documention/swagger.json');

global.rootPath = __dirname;

const { MAX_SUPPORT_SIZE } = require('./constant/type/fileSize.enum');

const apiRouter = require('./router/api.router');
const logger = require('./config/logger');
const { NODE_ENV } = require('./config/config');

const app = express();

app.use(cors());

// Structured request logging (skip under tests to keep output clean).
if (NODE_ENV !== 'test') {
    // eslint-disable-next-line global-require
    app.use(require('pino-http')({ logger }));
}

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
        .connect(MONGODB_URL, {
            // Bound the connection pool so bursts don't exhaust Atlas connections
            // and idle deploys keep a couple of warm sockets.
            maxPoolSize: 10,
            minPoolSize: 2,
        })
        .catch((error) => {
            logger.error(error.message);
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
    if (NODE_ENV !== 'test' || NODE_ENV === 'test-dev') {
        (req.log || logger).error(err);
    }
    res.status(err.status || 500).json({
        status: err.status || 500,
        errorStatus: err.errorStatus || 0,
        message: err.message || '',
    });
}
module.exports = app;
