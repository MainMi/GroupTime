const Joi = require('joi');
const { groupTypesEnum } = require('../constant');
const { ADMIN_ROLE } = require('../constant/user.role.enum');
const { BASIC_ROLE_USER } = require('../constant/group.enum');

const TIME_PATTERN = /^([0-9]|0[0-9]|1[0-9]|2[0-3]):[0-5][0-9]$/;

const ParametersSchema = Joi.object({
    usersLimit: Joi.number().integer().min(0).default(50),
    createEventInfosRole: Joi.string().valid(...Object.values(BASIC_ROLE_USER)).default(ADMIN_ROLE),
    assistantCommandRole: Joi.string().valid(...Object.values(BASIC_ROLE_USER)).default(ADMIN_ROLE),
    notifacionFromEmail: Joi.boolean().default(true),
    periodStartEvent: Joi.string().pattern(TIME_PATTERN).default('8:00'),
    periodEndEvent: Joi.string().pattern(TIME_PATTERN).default('21:00'),
    // GMT offset (hours) the group's schedule times are stored in.
    gmt: Joi.number().integer().min(-12).max(14)
        .default(0)
});

const GroupSchema = Joi.object({
    name: Joi.string().min(3).max(50).required(),
    description: Joi.string().min(3).max(500),
    users: Joi.array().items(Joi.string()),
    type: Joi.string().valid(...Object.values(groupTypesEnum)).default(groupTypesEnum.PRIVATE_TYPE),
    parameters: ParametersSchema
});

const InviteUsersToGroupSchema = Joi.object({
    usersId: Joi.array().items(Joi.object().required()).required(),
    roles: Joi.array().items(Joi.string().required()).required(),
    groupId: Joi.string().required()
});

module.exports = {
    GroupSchema,
    InviteUsersToGroupSchema
};
