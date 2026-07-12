const { MAX_GROUP_SEARCH_QUERY_LENGTH, MIN_GROUP_SEARCH_QUERY_LENGTH } = require('../constant/groupSearch');
const { MAX_USER_GROUPS } = require('../constant/group.enum');
const { FIND_TYPE } = require('../constant/type/findType.enum');
const { NOT_FIND_TYPE } = require('../constant/type/findType.enum');
const { NOT_VERIFIED_TYPE, VERIFIED_TYPE } = require('../constant/type/verificateToken.enum');
const { PERSONAL_TYPE } = require('../constant/type/groupTypes.enum');
const { ADMIN_ROLE } = require('../constant/user.role.enum');
const ApiError = require('../error/ErrorHandler');
const {
    GROUP_IS_ALREADY_CREATED, GROUP_IS_NOT_CREATED, MAX_GROUP_LIMIT_FN, MAX_PEOPLE_LIMIT,
    IS_GROUP_NOT_VEREFICATE, USER_IS_ALREADY_GROUP, USER_IN_ANY_GROUP_NOT_FOUND,
    USER_IN_GROUP_NOT_FOUND, PARAMS_IS_NOT_FOUND_FN, SEARCH_GROUP_INVALID_QUERY,
    PARAMS_IS_NOT_FOUND, PERSONAL_GROUP_FORBIDDEN
} = require('../error/errorMsg');
const { verificateService } = require('../service');
const { groupService } = require('../service/schedule');
const { groupValidator } = require('../validator');

module.exports = {
    isValidGroup: (req, res, next) => {
        try {
            const { value, error } = groupValidator.GroupSchema.validate(req.body);
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
    isValidInvites: (req, res, next) => {
        try {
            const { value, error } = groupValidator.InviteUsersToGroupSchema.validate(req.body);
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
    isGroupFind: (errorType = FIND_TYPE) => async (req, res, next) => {
        try {
            const { name = null, groupId = null } = req.body;

            const group = name
                ? await groupService.getGroupByName(name)
                : await groupService.getGroupById(groupId);
            if (errorType === FIND_TYPE ? group : !group) {
                return next(new ApiError(...Object.values(
                    errorType === FIND_TYPE
                        ? GROUP_IS_ALREADY_CREATED
                        : GROUP_IS_NOT_CREATED
                )));
            }
            if (errorType === NOT_FIND_TYPE ? !group : group) {
                return next(new ApiError(...Object.values(
                    errorType === FIND_TYPE
                        ? GROUP_IS_NOT_CREATED
                        : GROUP_IS_ALREADY_CREATED
                )));
            }
            req.group = errorType === NOT_FIND_TYPE ? group : undefined;

            next();
        } catch (e) {
            next(e);
        }
    },
    isGroupFindByQuery: async (req, res, next) => {
        try {
            const { query, groupId } = req.query;

            const groupsInfo = await groupService.findGroups({ query, groupId });

            if (!groupsInfo || !groupsInfo.count) {
                return next(new ApiError(...Object.values(
                    GROUP_IS_NOT_CREATED
                )));
            }
            req.groupsInfo = groupsInfo;

            next();
        } catch (e) {
            next(e);
        }
    },
    isUserInGroup: (req, res, next) => {
        try {
            const { groups, groupCount, _id: userId } = req.authUser;
            const { groupId } = req.body;
            if (!groupCount) {
                return next(new ApiError(...Object.values(USER_IN_ANY_GROUP_NOT_FOUND)));
            }
            const userInGroup = groups.find(
                (value) => value.user._id.toString() === userId.toString() && value.group?._id.toString() === groupId
            );
            if (!userInGroup) {
                return next(new ApiError(...Object.values(USER_IN_GROUP_NOT_FOUND)));
            }
            req.userInGroup = userInGroup;
            next();
        } catch (e) {
            next(e);
        }
    },
    // For the member-availability endpoint: the requested `userId` must be a
    // verified member of the same group the requester is in (already checked by
    // isUserInGroup). Guards against probing arbitrary users' schedules.
    isTargetUserInGroup: async (req, res, next) => {
        try {
            const { groupId, userId } = req.body;
            const membership = await verificateService.findVerificateUser({
                group: groupId,
                user: userId,
                type: VERIFIED_TYPE,
            });
            if (!membership) {
                return next(new ApiError(...Object.values(USER_IN_GROUP_NOT_FOUND)));
            }
            next();
        } catch (e) {
            next(e);
        }
    },
    isVerificateUser: (req, res, next) => {
        try {
            const { userInGroup } = req;
            if (userInGroup.type !== VERIFIED_TYPE) {
                res.status(202).json('The user is a member of the group but you have not been confirmed in the group yet');
                return;
            }
            next();
        } catch (e) {
            next(e);
        }
    },
    isMaxUserGroups: async (req, res, next) => {
        try {
            const { groupCount, _id } = req.authUser;

            // The personal schedule is a group under the hood but must not count
            // toward the limit — subtract it (a user has at most one).
            const personal = await groupService.findUserPersonalGroup(_id);
            const effectiveCount = groupCount - (personal ? 1 : 0);

            if (effectiveCount + 1 > MAX_USER_GROUPS) {
                return next(new ApiError(...Object.values(MAX_GROUP_LIMIT_FN(MAX_USER_GROUPS))));
            }
            next();
        } catch (e) {
            next(e);
        }
    },

    // Block people-oriented actions (inviting/joining) on a personal schedule —
    // it's a hidden, single-owner group. Expects req.group (loaded by isGroupFind).
    rejectPersonalGroup: (req, res, next) => {
        try {
            if (req.group?.type === PERSONAL_TYPE) {
                return next(new ApiError(...Object.values(PERSONAL_GROUP_FORBIDDEN)));
            }
            next();
        } catch (e) {
            next(e);
        }
    },
    isLimitUsersForGroup: (req, res, next) => {
        try {
            const { group } = req;

            const users = group.users.filter((user) => user.type !== NOT_VERIFIED_TYPE);

            if (users.length + 1 >= group.parameters.usersLimit) {
                return next(new ApiError(...Object.values(MAX_PEOPLE_LIMIT)));
            }
            next();
        } catch (e) {
            next(e);
        }
    },
    isNotifactionFromEmail: async (req, res, next) => {
        try {
            const { group } = req;

            if (!group.parameters.notifacionFromEmail) {
                return;
            }

            const { user } = await verificateService.findVerificateUser({ group: group._id, role: ADMIN_ROLE });
            req.emailAdmin = user.email;
            next();
        } catch (e) {
            next(e);
        }
    },
    isGroupUser: async (req, res, next) => {
        try {
            const { _id } = req.authUser;
            const { group } = req;

            const verificateUser = await verificateService.findVerificateUser({ user: _id, group: group._id });

            if (verificateUser?.type) {
                const errorMsg = verificateUser.type === NOT_VERIFIED_TYPE
                    ? IS_GROUP_NOT_VEREFICATE
                    : USER_IS_ALREADY_GROUP;
                next(new ApiError(...Object.values(errorMsg)));
                return;
            }
            req.verificate = verificateUser;
            next();
        } catch (e) {
            next(e);
        }
    },

    isSearchValid: (req, res, next) => {
        try {
            const { query } = req.query;
            if (!query) {
                return next(new ApiError(...Object.values(PARAMS_IS_NOT_FOUND_FN('query'))));
            }

            if (query.length < MIN_GROUP_SEARCH_QUERY_LENGTH || query.length > MAX_GROUP_SEARCH_QUERY_LENGTH) {
                next(new ApiError(...Object.values(SEARCH_GROUP_INVALID_QUERY)));
                return;
            }

            next();
        } catch (e) {
            next(e);
        }
    }

};
