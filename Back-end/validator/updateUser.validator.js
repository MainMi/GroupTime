const Joi = require('joi');
const { regexEnum } = require('../constant');

const UpdateUserSchema = Joi.object({
    firstName: Joi.string()
        .min(2)
        .max(20),
    lastName: Joi.string()
        .min(2)
        .max(30),
    birthday: Joi.date(),
    phone: Joi.string().regex(regexEnum.REGEXP_PHONE).allow(''),
    contacts: Joi.object({
        Github: Joi.string().allow(''),
        Instagram: Joi.string().allow(''),
        Telegram: Joi.string().allow('')
    })
}).min(1);

module.exports = UpdateUserSchema;
