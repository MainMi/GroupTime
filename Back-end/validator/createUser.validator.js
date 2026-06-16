const Joi = require('joi');
const { regexEnum } = require('../constant');

const UserSchema = Joi.object({
    nickname: Joi.string()
        .min(2)
        .max(25)
        .required(),
    firstName: Joi.string()
        .min(2)
        .max(20)
        .required(),
    lastName: Joi.string()
        .min(2)
        .max(30)
        .required(),
    email: Joi.string()
        .regex(regexEnum.REGEX_EMAIL)
        .required()
        .trim()
        .lowercase(),
    password: Joi.string().regex(regexEnum.REGEX_PASSWORD).required(),
    group: Joi.string().regex(regexEnum.REGEX_GROUP),
    birthday: Joi.date().required(),
    phone: Joi.string().regex(regexEnum.REGEXP_PHONE),
    contacts: Joi.object({
        Github: Joi.string(),
        Instagram: Joi.string(),
        Telegram: Joi.string()
    })
});

module.exports = UserSchema;
