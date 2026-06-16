const ApiError = require('../error/ErrorHandler');

const { CONFIRM_USER } = require('../constant/type/actionTokenTypes.enum');
const {
    NOT_CONFIRM_EMAIL,
    PARAMS_IS_NOT_FOUND,
    NOT_IS_PROVIDED_TOKEN, NOT_VALID_TOKEN,
    NOT_VALID_ACTION_TOKEN
} = require('../error/errorMsg');

const OAuthModel = require('../model/OAuth.model');

const { authService } = require('../service');
const { authValidator, emailValidator } = require('../validator');
const { REFRESH } = require('../constant/type/tokenType.enum');
const { populateGroupsDetail } = require('../service/user.service');
const { DEFAULT_INFO, GROUP_INFO, GROUP_AND_USERS_INFO } = require('../constant/type/populateType.enum');

module.exports = {
    isLoginDataValid: (req, res, next) => {
        try {
            const { value, error } = authValidator.validate(req.body);

            if (error) {
                const { status, errorStatus } = PARAMS_IS_NOT_FOUND;
                next(new ApiError(status, errorStatus, error.details[0].message));
                return;
            }

            if (!(req.user.authorized)) {
                next(new ApiError(...Object.values(NOT_CONFIRM_EMAIL)));
                return;
            }

            req.body = value;
            next();
        } catch (e) {
            next(e);
        }
    },
    emailValid: (req, res, next) => {
        try {
            const { value, error } = emailValidator.validate({
                email: req.body.email
            });

            if (error) {
                const { status, errorStatus } = PARAMS_IS_NOT_FOUND;
                next(new ApiError(status, errorStatus, error.details[0].message));
                return;
            }

            req.body.email = value.email;
            next();
        } catch (e) {
            next(e);
        }
    },
    checkAccessToken: (fetchUserType = DEFAULT_INFO) => async (req, res, next) => {
        try {
            const token = req.get('Authorization');
            if (!token) {
                return next(new ApiError(...Object.values(NOT_IS_PROVIDED_TOKEN)));
            }

            authService.validateToken(token);

            let tokenData = await OAuthModel.findOne({ access_token: token }).populate('userId').exec();

            if (!tokenData || !tokenData.userId) {
                return next(new ApiError(...Object.values(NOT_VALID_TOKEN)));
            }

            switch (fetchUserType) {
                case GROUP_INFO:
                    await tokenData.userId.populate('groups');
                    break;
                case GROUP_AND_USERS_INFO:
                    await populateGroupsDetail(tokenData.userId);
                    break;
                default:
                    break;
            }

            tokenData = tokenData.toObject();

            req.authUser = tokenData.userId;

            next();
        } catch (e) {
            next(e);
        }
    },

    checkRefreshToken: async (req, res, next) => {
        try {
            const token = req.get('Authorization');

            if (!token) {
                throw new ApiError(...Object.values(NOT_IS_PROVIDED_TOKEN));
            }

            authService.validateToken(token, REFRESH);

            const tokenData = await authService.findByParamsToken({ refresh_token: token });

            if (!tokenData || !tokenData.userId) {
                throw new ApiError(...Object.values(NOT_VALID_TOKEN));
            }
            const { id: userId } = tokenData.userId;
            const tokenPair = authService.generateTokenPair({ userId });
            await authService.createOauth(userId, tokenPair);

            req.tokenPair = tokenPair;
            next();
        } catch (e) {
            next(e);
        }
    },
    checkActionToken: (action_type = CONFIRM_USER) => async (req, res, next) => {
        try {
            const token = req.get('Authorization');

            if (!(token)) {
                return next(new ApiError(...Object.values(NOT_IS_PROVIDED_TOKEN)));
            }

            await authService.validateActionToken(token, action_type);

            const actionTokenWithUser = await authService
                .findActionTokenByParams({ action_token: token, action_type })
                .populate('userId')
                .populate('groupId');
            if (!actionTokenWithUser) {
                return next(new ApiError(...Object.values(NOT_VALID_ACTION_TOKEN)));
            }

            req.user = actionTokenWithUser;
            await authService.deleteActionTokenByParams({ action_token: token, action_type });

            next();
        } catch (e) {
            next(e);
        }
    },
};
