const Joi = require('joi');
const { regexEnum } = require('../constant');

const loginSchema = Joi.object({
    email: Joi.string()
        .regex(regexEnum.REGEX_EMAIL)
        .required()
        .trim()
        .lowercase(),
    password: Joi.string().regex(regexEnum.REGEX_PASSWORD).required()
});

module.exports = loginSchema;
