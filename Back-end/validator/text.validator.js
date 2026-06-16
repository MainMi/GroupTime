const Joi = require('joi');

const textSchema = Joi.object({
    text: Joi.string()
        .required()
        .trim()
        .lowercase(),
    page: Joi.number()
        .max(100000)
        .default(1),
    limit: Joi.number()
        .min(3)
        .max(10000)
        .default(10)
});

module.exports = textSchema;
