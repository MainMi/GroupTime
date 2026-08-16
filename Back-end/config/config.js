module.exports = {
    NODE_ENV: process.env.NODE_ENV || '',
    LOG_LEVEL: process.env.LOG_LEVEL || '',
    PORT: process.env.PORT || 5000,
    FROENT_URL: (process.env.FROENT_URL || 'http://localhost:3000').replace(/\/+$/, ''),
    // Public base URL of THIS API, used to build absolute .ics subscription links
    // that calendar apps (Google/Outlook) fetch directly. No trailing slash.
    SELF_URL: (process.env.SELF_URL || `http://localhost:${process.env.PORT || 5000}`).replace(/\/+$/, ''),
    MONGODB_URL: process.env.MONGODB_URL,

    // Extra browser origins allowed to call this API, comma-separated. FROENT_URL
    // and the local dev hosts are always allowed — this is for preview deploys or
    // a second front-end domain.
    CORS_ORIGINS: process.env.CORS_ORIGINS || '',

    API_SCHEDULE: process.env.API_SCHEDULE || ' ',

    JWT_SECRET: process.env.JWT_SECRET || 'secret',
    JWT_SECRET_REFRESH: process.env.JWT_SECRET_REFRESH || 'secret refresh',

    ACTION_SECRET_FORGOT_PASSWORD: process.env.ACTION_SECRET_FORGOT_PASSWORD || 'forgotPass',
    ACTION_SECRET_CONFIRM_EMAIL: process.env.ACTION_SECRET_CONFIRM_EMAIL || 'confirmEmail',
    ACTION_SECRET_CONFIRM_ADD_GROUP: process.env.ACTION_SECRET_CONFIRM_ADD_GROUP || 'confirmUser',
    ACTION_SECRET_INVITE_USER: process.env.ACTION_SECRET_INVITE_USER || 'inviteUser',

    NO_REPLY_EMAIL: process.env.NO_REPLY_EMAIL || ' ',
    NO_REPLY_EMAIL_PASS: process.env.NO_REPLY_EMAIL_PASS || ' ',

    S3_REGION: process.env.S3_REGION || '',
    S3_BUCKET_NAME: process.env.S3_BUCKET_NAME || '',
    AWS_ACCESS_KEY: process.env.AWS_ACCESS_KEY || '',
    AWS_SECRET_KEY: process.env.AWS_SECRET_KEY || '',

    GROQ_API_KEY: process.env.GROQ_API_KEY || '',
    DEFAULT_MODEL: process.env.DEFAULT_MODEL || '',

    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || '',

    // Telegram reminders. The bot itself lives in the gitignored /telegram-bot
    // service; the API only builds the deep-link and relays messages to it.
    // BOT_USERNAME builds t.me/<username>?start=<token>; BOT_URL is the relay
    // base; the two secrets must match the bot's env.
    TELEGRAM_BOT_USERNAME: process.env.TELEGRAM_BOT_USERNAME || '',
    TELEGRAM_BOT_URL: (process.env.TELEGRAM_BOT_URL || '').replace(/\/+$/, ''),
    TELEGRAM_LINK_SECRET: process.env.TELEGRAM_LINK_SECRET || 'telegram-link-secret',
    TELEGRAM_RELAY_SECRET: process.env.TELEGRAM_RELAY_SECRET || '',
};
