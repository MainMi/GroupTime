const { MAX_GROUP_SEARCH_QUERY_LENGTH, MIN_GROUP_SEARCH_QUERY_LENGTH } = require('../constant/groupSearch');

module.exports = {
    NOT_VALID_USER: {
        status: 400,
        errorStatus: 4001,
        message: 'Not valid path url'
    },
    NOT_VALID_PASSWORD: {
        status: 400,
        errorStatus: 4002,
        message: 'Not valid password'
    },
    GROUP_IS_REQUIRE: {
        status: 400,
        errorStatus: 4003,
        message: 'Group is require'
    },
    PARAMS_IS_NOT_FILE: {
        status: 400,
        errorStatus: 4004,
        message: 'Params is not file'
    },
    GOOGLE_CREDENTIAL_MISSING: {
        status: 400,
        errorStatus: 4005,
        message: 'Missing Google credential'
    },
    NOT_CONFIRM_EMAIL: {
        status: 401,
        errorStatus: 4011,
        message: 'You dont confirm email'
    },
    NOT_VALID_TOKEN: {
        status: 401,
        errorStatus: 4012,
        message: 'Token is invalid'
    },
    NOT_VALID_ACTION_TOKEN: {
        status: 401,
        errorStatus: 4013,
        message: 'Action token is invalid'
    },
    NOT_IS_PROVIDED_TOKEN: {
        status: 401,
        errorStatus: 4014,
        message: 'No token provided'
    },
    IS_GROUP_NOT_VEREFICATE: {
        status: 401,
        errorStatus: 4016,
        message: 'User already his group, but you dont verificate'
    },
    WRONG_EMAIL_OR_PASSWORD: {
        status: 401,
        errorStatus: 4017,
        message: 'Wrong email or passworld'
    },
    GOOGLE_EMAIL_NOT_VERIFIED: {
        status: 401,
        errorStatus: 4018,
        message: 'Google email is not verified'
    },
    MAX_GROUP_LIMIT_FN: (limit = 5) => ({
        status: 403,
        errorStatus: 4031,
        message: `You can't add more than ${limit} group`
    }),
    MAX_PEOPLE_LIMIT: {
        status: 403,
        errorStatus: 4032,
        message: 'Number of people in a group maximum'
    },
    ACCESS_DENIED: {
        status: 403,
        errorStatus: 4033,
        message: 'Access denied'
    },
    NOT_MODIFY_YOURSELF: {
        status: 403,
        errorStatus: 4034,
        message: 'You can\'t modify it yourself.'
    },
    OWNER_CANNOT_LEAVE: {
        status: 403,
        errorStatus: 4035,
        message: 'The owner must transfer ownership before leaving the group.'
    },
    OWNER_CANNOT_BE_MODIFIED: {
        status: 403,
        errorStatus: 4036,
        message: 'The group owner cannot be modified or removed.'
    },
    ASSISTANT_REQUEST_FAILED: {
        status: 403,
        errorStatus: 4037,
        message: 'Assistant request failed'
    },
    GROUP_IS_NOT_CREATED: {
        status: 404,
        errorStatus: 4041,
        message: 'Group is not found'
    },
    PARAMS_IS_NOT_FOUND_FN: (paramsName) => ({
        status: 404,
        errorStatus: 4042,
        message: `Params: ${paramsName} not found`
    }),
    PARAMS_IS_NOT_FOUND: {
        status: 404,
        errorStatus: 4043,
        message: 'Params is not found'
    },
    USER_IN_GROUP_NOT_FOUND: {
        status: 404,
        errorStatus: 4044,
        message: 'User not found in the group'
    },
    USER_IN_ANY_GROUP_NOT_FOUND: {
        status: 404,
        errorStatus: 4045,
        message: 'User has not joined any groups'
    },
    SEARCH_GROUP_INVALID_QUERY: {
        status: 404,
        errorStatus: 4046,
        message: `Query length should be between ${MIN_GROUP_SEARCH_QUERY_LENGTH} and ${MAX_GROUP_SEARCH_QUERY_LENGTH}`
    },
    WEEK_NOT_FOUND: {
        status: 404,
        errorStatus: 4051,
        message: 'Week not found'
    },
    WEEK_FOUND: {
        status: 404,
        errorStatus: 4052,
        message: 'Week already exist'
    },
    WEEKS_NOT_FOUND: {
        status: 404,
        errorStatus: 4053,
        message: 'Don\'t have any weeks for this group'
    },
    DYNAMIC_WEEKS_NOT_FOUND: {
        status: 404,
        errorStatus: 4054,
        message: 'Dynamic weeks not found'
    },
    INVALID_SWAPPING_COUNT_WEEKS: {
        status: 404,
        errorStatus: 4055,
        message: 'Invalid countWeek1 and(or) countWeek2 for dynamic weeks swapping'
    },
    INVALID_NWEEK: {
        status: 404,
        errorStatus: 4056,
        message: 'Invalid nWeek. You don\'t have a dynamic week with your current nWeek.'
    },
    LESSON_NOT_FOUND: {
        status: 404,
        errorStatus: 4057,
        message: 'EventInfo not found for specified eventInfoId'
    },
    PAIR_NOT_FOUND: {
        status: 404,
        errorStatus: 4058,
        message: 'Event not found for your extraEvent id'
    },
    USERS_NOT_FOUND: {
        status: 404,
        errorStatus: 4059,
        message: 'Users not found'
    },
    GROUPS_NOT_FOUND: {
        status: 404,
        errorStatus: 4060,
        message: 'Groups not found'
    },
    EVENTDATE_NOT_FOUND: {
        status: 404,
        errorStatus: 4061,
        message: 'EventDate not found for specified eventDateId'
    },
    GROUP_IS_ALREADY_CREATED: {
        status: 409,
        errorStatus: 4091,
        message: 'Group is created already'
    },
    USER_IS_ALREADY_GROUP: {
        status: 409,
        errorStatus: 4092,
        message: 'User already his group'
    },
    USER_OR_EMAIL_IS_CREATED: {
        status: 409,
        errorStatus: 4093,
        message: 'This nickname or email is already taken'
    },
    MAX_FILES_IS_DETAILINFO: {
        status: 413,
        errorStatus: 4131,
        message: 'Max count file to DetailInfo'
    },
    MAX_SIZE_IS_FILE: {
        status: 413,
        errorStatus: 4132,
        message: 'File is to big'
    },
    MAX_EVENT_FILES_FN: (limit) => ({
        status: 413,
        errorStatus: 4133,
        message: `Max ${limit} files per event`
    }),
    FILE_IS_NOT_VALID_EXTENSION: {
        status: 419,
        errorStatus: 4191,
        message: 'File is not available extension'
    },
    ROLE_INCORRECT: {
        status: 500,
        errorStatus: 5001,
        message: 'Role incorrect'
    },
    ACTION_TOKEN_TYPE_INCORRECT: {
        status: 500,
        errorStatus: 5002,
        message: 'invalid action token type'
    },
    TEMPLATE_IS_NOT_FOUND: {
        status: 500,
        errorStatus: 5003,
        message: 'Template is not found'
    }
};
