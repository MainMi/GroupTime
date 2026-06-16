const Joi = require('joi');

const messageSchema = Joi.object({
    message: Joi.string()
        .required()
        .trim()
        .min(3)
        .max(2000),
    sessionId: Joi.string(),
    groundData: Joi.object()
});

module.exports = messageSchema;
