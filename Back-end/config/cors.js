const { FROENT_URL, CORS_ORIGINS, NODE_ENV } = require('./config');

const stripTrailingSlash = (url) => url.trim().replace(/\/+$/, '');

// The front-end origin plus the local dev hosts, so `npm run dev` keeps working
// against a deployed API. Extra origins (preview deploys, a second domain) come
// from CORS_ORIGINS.
const allowedOrigins = new Set(
    [
        FROENT_URL,
        'http://localhost:3000',
        'http://127.0.0.1:3000',
        ...CORS_ORIGINS.split(','),
    ]
        .map(stripTrailingSlash)
        .filter(Boolean)
);

// Requests without an Origin header are not browser cross-origin requests:
// calendar apps fetching an .ics subscription, curl, health checks and the
// same-origin Swagger page all land here. Blocking them would break the
// subscription links while adding no protection — CORS only constrains browsers.
const isAllowed = (origin) => !origin || allowedOrigins.has(stripTrailingSlash(origin));

module.exports = {
    allowedOrigins,
    corsOptions: {
        origin: (origin, callback) => {
            if (isAllowed(origin)) {
                return callback(null, true);
            }
            // Reject by refusing the header rather than raising: the request still
            // completes, the browser just denies the response to the page. Throwing
            // here would surface a 500 in the logs for every probe.
            return callback(null, false);
        },
        credentials: true,
        // The client sends its JWT in the Authorization header, so preflights must
        // be told that header is acceptable.
        allowedHeaders: [
            'Content-Type',
            'Authorization'
        ],
        methods: [
            'GET',
            'POST',
            'PATCH',
            'PUT',
            'DELETE',
            'OPTIONS'
        ],
        maxAge: 86400,
    },
    // Under tests supertest issues origin-less requests, so the allowlist is a no-op
    // there; exported for the startup log.
    describe: () => (NODE_ENV === 'test' ? [] : [...allowedOrigins]),
};
