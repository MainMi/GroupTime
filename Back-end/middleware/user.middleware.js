const mongoose = require('mongoose');
const ApiError = require('../error/ErrorHandler');
const userModel = require('../model/user.model');

const { IMG_MINETYPE, FILE_MINETYPE } = require('../constant/fileMinetypes.enum');
const { FILE_MAX_SIZE, IMG_MAX_SIZE } = require('../constant/type/fileSize.enum');
const {
    FILE_TYPE,
    IMAGE_TYPE,
    FIND_TYPE,
    ERROR_TYPE
} = require('../constant/type/fileType.enum');
const { createUserValidator, updateUserValidator } = require('../validator');
const userRoleEnum = require('../constant/user.role.enum');
const {
    USER_OR_EMAIL_IS_CREATED,
    PARAMS_IS_NOT_FOUND,
    PARAMS_IS_NOT_FILE,
    FILE_IS_NOT_VALID_EXTENSION,
    ACCESS_DENIED,
    MAX_SIZE_IS_FILE,
    NOT_MODIFY_YOURSELF,
    PARAMS_IS_NOT_FOUND_FN,
    USERS_NOT_FOUND
} = require('../error/errorMsg');
const { userService } = require('../service');

const { USER_ROLE } = userRoleEnum;

function permisionRole(currentUserRole, checkRole, objRole) {
    if (objRole) {
        return checkRole.includes(currentUserRole);
    }
    const arrRole = Object.values(userRoleEnum);
    return arrRole.indexOf(currentUserRole) >= arrRole.indexOf(checkRole);
}

module.exports = {
    isValidUser: (req, res, next) => {
        try {
            const { value, error } = createUserValidator.validate(req.body);
            if (error) {
                const { status, errorStatus } = PARAMS_IS_NOT_FOUND;
                next(new ApiError(status, errorStatus, error.details[0].message));
                return;
            }

            req.body = value;
            next();
        } catch (e) {
            next(e);
        }
    },
    isValidUpdateUser: (req, res, next) => {
        try {
            const { value, error } = updateUserValidator.validate(req.body);
            if (error) {
                const { status, errorStatus } = PARAMS_IS_NOT_FOUND;
                next(new ApiError(status, errorStatus, error.details[0].message));
                return;
            }

            req.body = value;
            next();
        } catch (e) {
            next(e);
        }
    },
    isUsersIdValid: async (req, res, next) => {
        try {
            const { usersId } = req.body;
            if (!usersId) {
                return next(new ApiError(
                    ...Object.values(PARAMS_IS_NOT_FOUND_FN('usersId'))
                ));
            }
            const validUsersId = usersId.filter(({ id }) => mongoose.Types.ObjectId.isValid(id)).map(({ id }) => id);
            req.usersId = validUsersId;

            const existingUsers = await userService.getUsersById(validUsersId);

            if (!existingUsers.length) {
                return next(new ApiError(...Object.values(USERS_NOT_FOUND)));
            }
            req.users = existingUsers;

            next();
        } catch (e) {
            next(e);
        }
    },
    isUserLogin: async (req, res, next) => {
        try {
            const { email, nickname } = req.body;
            const user = await userModel.findOne({
                $or: [
                    { email },
                    { nickname }
                ]
            });

            if (user) {
                return next(new ApiError(...Object.values(USER_OR_EMAIL_IS_CREATED)));
            }
            next();
        } catch (e) {
            next(e);
        }
    },

    getUserByDunamically: (paramsName = '_id', pathData = 'body', dataBaseName = paramsName) => async (req, res, next) => {
        const param = req[pathData][paramsName];

        if (!param) {
            return next(new ApiError(...Object.values(
                PARAMS_IS_NOT_FOUND_FN(`${pathData}|${paramsName}`)
            )));
        }

        const UserByParams = await userModel.findOne({ [dataBaseName]: param }).select('+password').populate({
            path: 'groups',
            populate: [{
                path: 'group',
                select: {
                    avatar: 1,
                    role: 1,
                    name: 1,
                    description: 1,
                    type: 1,
                    parameters: 1,
                    users: 1,
                    userCount: 1,
                    _id: 1,
                }
            }]
        });

        if (!UserByParams) {
            return next(new ApiError(...Object.values(USERS_NOT_FOUND)));
        }
        req.user = UserByParams;
        next();
    },
    isChangeYourself: (
        pathArr = [
            'body',
            'authUser'
        ],
        parameterArr = [
            'userId',
            '_id'
        ]
    ) => (req, res, next) => {
        try {
            const [
                firstPath,
                secondPath
            ] = pathArr;
            const [
                firstParameter,
                secondParameter
            ] = parameterArr;
            const firstParam = req[firstPath][firstParameter];
            const secondParam = req[secondPath][secondParameter];

            if (firstParam === secondParam) {
                next(new ApiError(...Object.values(NOT_MODIFY_YOURSELF)));
                return;
            }
            next();
        } catch (e) {
            next(e);
        }
    },
    checkValidFileParam: (params, typeFile = FILE_TYPE) => (req, res, next) => {
        try {
            const param = req.files[params];

            if (!param) {
                return next(new ApiError(...Object.values(PARAMS_IS_NOT_FILE)));
            }

            const { size, mimetype } = param;

            let typeFiles = typeFile;
            let limitSize = FILE_MAX_SIZE;
            let filesMinetype = FILE_MINETYPE;
            if (typeFile === FIND_TYPE) {
                // eslint-disable-next-line no-nested-ternary
                typeFiles = IMG_MINETYPE.includes(mimetype)
                    ? IMAGE_TYPE
                    : FILE_MINETYPE.includes(mimetype)
                        ? FILE_TYPE
                        : ERROR_TYPE;
            }
            switch (typeFiles) {
                case ERROR_TYPE:
                    next(new ApiError(...Object.values(
                        FILE_IS_NOT_VALID_EXTENSION
                    )));
                    break;
                case FILE_TYPE:
                    break;
                case IMAGE_TYPE:
                    limitSize = IMG_MAX_SIZE;
                    filesMinetype = IMG_MINETYPE;
                    break;
                default:
                    next(new ApiError(...Object.values(PARAMS_IS_NOT_FOUND)));
                    break;
            }

            if (size > limitSize) {
                next(new ApiError(...Object.values(MAX_SIZE_IS_FILE)));
                return;
            }
            if (!filesMinetype.includes(mimetype)) {
                next(new ApiError(...Object.values(
                    FILE_IS_NOT_VALID_EXTENSION
                )));
                return;
            }

            req.files[params].types = typeFile;

            next();
        } catch (e) {
            next(e);
        }
    },
    checkGlobalUserRole: (currentRole = USER_ROLE, objRole = false) => (req, res, next) => {
        try {
            const { global_role: role } = req.authUser;

            if (!permisionRole(role, currentRole, objRole)) {
                return next(new ApiError(...Object.values(ACCESS_DENIED)));
            }

            next();
        } catch (e) {
            next(e);
        }
    },
    checkGroupUserRole: (currentRole = USER_ROLE, objRole = false) => (req, res, next) => {
        try {
            const { role } = req.userInGroup;

            if (!permisionRole(role, currentRole, objRole)) {
                return next(new ApiError(...Object.values(ACCESS_DENIED)));
            }
            next();
        } catch (e) {
            next(e);
        }
    },
    permisionRole
};
