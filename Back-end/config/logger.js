const pino = require('pino');
const { NODE_ENV, LOG_LEVEL } = require('./config');

const isDev = NODE_ENV === 'development' || NODE_ENV === 'debug';

// Structured application logger. Pretty-printed in development, JSON in
// production (one line per event, ready for log shippers). Silent under tests.
const logger = pino({
    level: LOG_LEVEL || (NODE_ENV === 'test' ? 'silent' : 'info'),
    ...(isDev
        ? {
            transport: {
                target: 'pino-pretty',
                options: { colorize: true, translateTime: 'SYS:HH:MM:ss', ignore: 'pid,hostname' },
            },
        }
        : {}),
});

module.exports = logger;
