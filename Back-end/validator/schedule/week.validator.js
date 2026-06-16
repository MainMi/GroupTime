const Joi = require('joi');

const customJoi = Joi.extend((joi) => ({
    type: 'stringDate',
    base: joi.date(),
    messages: {
        'stringDate.base': '{{#label}} must be a valid date'
    },
    coerce: {
        from: 'string',
        method(value, helpers) {
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) {
                return { value, errors: helpers.error('stringDate.base') };
            }
            return { value: date };
        }
    }
}));

const deleteWeekSchema = Joi.object({
    groupId: Joi.string()
        .required(),
    date: customJoi.stringDate().required(),
    isStatic: Joi.bool()
        .required()
});

const swapWeeksSchema = Joi.object({
    groupId: Joi.string()
        .required(),
    countWeek1: Joi.number()
        .integer()
        .min(0)
        .required(),
    countWeek2: Joi.number()
        .integer()
        .min(0)
        .required()
});

const swapStaticWeeksSchema = Joi.object({
    groupId: Joi.string()
        .required(),
    weekId1: Joi.string()
        .required(),
    weekId2: Joi.string()
        .required()
});

const getDynamicWeek = Joi.object({
    groupId: Joi.string()
        .required(),
    date: customJoi.stringDate().required(),
});

const getSchedule = Joi.object({
    groupId: Joi.string()
        .required(),
    date: customJoi.stringDate().required(),
});

module.exports = {
    deleteWeekSchema,
    swapWeeksSchema,
    swapStaticWeeksSchema,
    getDynamicWeek,
    getSchedule
};
