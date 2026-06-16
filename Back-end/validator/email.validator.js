const Joi = require('joi');
const { regexEnum } = require('../constant');

const emailSchema = Joi.object({
    email: Joi.string()
        .regex(regexEnum.REGEX_EMAIL)
        .required()
        .trim()
        .lowercase(),
});

module.exports = emailSchema;
