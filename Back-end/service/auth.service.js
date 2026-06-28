const bcrypt = require('bcrypt');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const { OAuth2Client } = require('google-auth-library');

const ApiError = require('../error/ErrorHandler');
const {
    JWT_SECRET,
    JWT_SECRET_REFRESH,
    ACTION_SECRET_FORGOT_PASSWORD,
    ACTION_SECRET_CONFIRM_EMAIL,
    ACTION_SECRET_CONFIRM_ADD_GROUP,
    ACTION_SECRET_INVITE_USER,
    GOOGLE_CLIENT_ID
} = require('../config/config');
const { ACCESS } = require('../constant/type/tokenType.enum');
const {
    FORGOT_PASSWORD,
    CONFIRM_EMAIL,
    CONFIRM_USER,
    CONFIRM_ADMIN,
    INVITE_USER
} = require('../constant/type/actionTokenTypes.enum');
const actionTokenModel = require('../model/actionToken.model');
const OAuthModel = require('../model/OAuth.model');

const googleClient = new OAuth2Client(GOOGLE_CLIENT_ID);
const {
    WRONG_EMAIL_OR_PASSWORD,
    NOT_VALID_TOKEN,
    NOT_VALID_ACTION_TOKEN,
    ACTION_TOKEN_TYPE_INCORRECT
} = require('../error/errorMsg');

module.exports = {
    hashPassword: (password) => bcrypt.hash(password, 10),
    comparePassword: async (password, hashPassword) => {
        const isPasswordEquels = await bcrypt.compare(password, hashPassword);

        if (!isPasswordEquels) {
            throw new ApiError(...Object.values(WRONG_EMAIL_OR_PASSWORD));
        }
    },
    generateTokenPair: (encodeData) => {
        // Unique `jti` per token: without it, two pairs minted for the same user
        // within the same second are byte-identical, and the unique-indexed OAuth
        // token columns then reject the duplicate (e.g. login immediately followed
        // by a refresh). The claim is ignored on verification.
        const access_token = jwt.sign(encodeData, JWT_SECRET, { expiresIn: '30m', jwtid: crypto.randomBytes(12).toString('hex') });
        const refresh_token = jwt.sign(encodeData, JWT_SECRET_REFRESH, { expiresIn: '30d', jwtid: crypto.randomBytes(12).toString('hex') });
        return { access_token, refresh_token };
    },
    createOauth: (userId, tokenPair) => OAuthModel.create({ userId, ...tokenPair }),

    // Verify a Google Identity Services ID token (the `credential` from the
    // frontend GoogleLogin popup) and return its payload (email, names, sub, ...).
    verifyGoogleIdToken: async (credential) => {
        try {
            const ticket = await googleClient.verifyIdToken({
                idToken: credential,
                audience: GOOGLE_CLIENT_ID,
            });
            return ticket.getPayload();
        } catch (e) {
            throw new ApiError(...Object.values(NOT_VALID_TOKEN));
        }
    },
    validateToken: (token, tokenType = ACCESS) => {
        const tokenTypeKey = (tokenType === ACCESS)
            ? JWT_SECRET
            : JWT_SECRET_REFRESH;
        try {
            return jwt.verify(token, tokenTypeKey);
        } catch (e) {
            throw new ApiError(...Object.values(NOT_VALID_TOKEN));
        }
    },
    generateActionToken: async (encodeData, actionType) => {
        let expiresIn = '48h';
        let secretWord = ACTION_SECRET_CONFIRM_EMAIL;
        switch (actionType) {
            case FORGOT_PASSWORD:
                expiresIn = '24h';
                secretWord = ACTION_SECRET_FORGOT_PASSWORD;
                break;
            case CONFIRM_EMAIL:
                break;
            case CONFIRM_USER:
                expiresIn = '30d';
                secretWord = ACTION_SECRET_CONFIRM_ADD_GROUP;
                break;
            case CONFIRM_ADMIN:
                expiresIn = '7d';
                secretWord = ACTION_SECRET_CONFIRM_ADD_GROUP;
                break;
            case INVITE_USER:
                expiresIn = '14d';
                secretWord = ACTION_SECRET_INVITE_USER;
                break;
            default:
                throw new ApiError(
                    ...Object.values(ACTION_TOKEN_TYPE_INCORRECT)
                );
        }
        const token = await jwt.sign(encodeData, secretWord, { expiresIn });

        return token;
    },

    deleteManyParamsToken: (paramsData) => OAuthModel.deleteMany(paramsData),

    findByParamsToken: (paramsData) => OAuthModel.findOne(paramsData).populate('userId'),
    // Action token function
    createActionToken: (tokenData) => actionTokenModel.create(tokenData),

    findActionTokenByParams: (tokenData) => actionTokenModel.findOne(tokenData).populate('userId'),

    deleteActionTokenByParams: (deleteData) => actionTokenModel.deleteOne(deleteData),

    validateActionToken: (token, actionType) => {
        let secretWord = ACTION_SECRET_CONFIRM_EMAIL;

        switch (actionType) {
            case FORGOT_PASSWORD:
                secretWord = ACTION_SECRET_FORGOT_PASSWORD;
                break;
            case CONFIRM_EMAIL:
                break;
            case CONFIRM_USER:
                secretWord = ACTION_SECRET_CONFIRM_ADD_GROUP;
                break;
            case CONFIRM_ADMIN:
                secretWord = ACTION_SECRET_CONFIRM_ADD_GROUP;
                break;
            case INVITE_USER:
                secretWord = ACTION_SECRET_INVITE_USER;
                break;
            default:
                throw new ApiError(
                    ...Object.values(ACTION_TOKEN_TYPE_INCORRECT)
                );
        }
        try {
            return jwt.verify(token, secretWord);
        } catch (e) {
            throw new ApiError(...Object.values(NOT_VALID_ACTION_TOKEN));
        }
    }

};
