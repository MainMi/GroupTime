module.exports = {
    NODE_ENV: process.env.NODE_ENV || '',
    LOG_LEVEL: process.env.LOG_LEVEL || '',
    PORT: process.env.PORT || 5000,
    FROENT_URL: (process.env.FROENT_URL || 'http://localhost:3000').replace(/\/+$/, ''),
    MONGODB_URL: process.env.MONGODB_URL,

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
};
