// event.validator.js

const Joi = require('joi');
const { regexEnum, weekEnum } = require('../../constant');
const scheduleDate = require('../../helper/scheduleDate.helper');
const { TIME_REGEX } = require('../../constant/regex.enum');

const customJoi = Joi.extend((joi) => ({
    type: 'stringDate',
    base: joi.any(),
    messages: {
        'stringDate.base': '{{#label}} must be a valid date',
        'stringDate.timeRequired': '{{#label}} date must contain time in format HH:MM or HH:MM:SS',
    },
    coerce: {
        from: 'string',
        method(value, helpers) {
            const dateObj = new Date(value);
            if (Number.isNaN(dateObj.getTime())) {
                return { value, errors: helpers.error('stringDate.base') };
            }
            return { value: dateObj };
        }
    },
    rules: {
        requireTime: {
            method(isTime = true) {
                return this.$_addRule({ name: 'requireTime', args: { isTime } });
            },
            args: [{
                name: 'isTime',
                assert: joi.boolean(),
                message: 'isTime must be a boolean'
            }],
            // eslint-disable-next-line no-unused-vars
            validate(value, helpers, args, options) {
                const originalValue = helpers.original;

                if (args.isTime) {
                    const hasTime = TIME_REGEX.test(originalValue.trim());

                    if (!hasTime) {
                        return helpers.error('stringDate.timeRequired');
                    }
                }

                const dateObj = new Date(value);

                const time = dateObj.toTimeString().split(':').slice(0, 2).join(':');
                const dayNumber = dateObj.getDay();
                const day = Object.values(weekEnum)[!dayNumber ? 6 : dayNumber - 1];

                const countWeek = scheduleDate.getISOWeekNumber(dateObj);

                return {
                    value: {
                        date: dateObj,
                        time,
                        day,
                        countWeek
                    }
                };
            }
        }
    }
}));

const eventSchemaBase = {
    groupId: Joi.string().required(),
    date: customJoi.stringDate().requireTime(true).required(),
    duration: Joi.number().min(5).max(300).required(),
    description: Joi.string().allow(''),
    name: Joi.string().min(2).max(50).required(),
    // Teacher, place, platform and link are optional (events aren't university-bound):
    // accept empty strings sent by the client when the field is left blank.
    teacherName: Joi.string().min(2).max(50).allow(''),
    type: Joi.string().min(2).max(50).allow(''),
    color: Joi.string().regex(/^#[0-9a-fA-F]{6}$/).allow(''),
    place: Joi.string().min(2).max(50).allow(''),
    platform: Joi.string().min(2).max(50).allow(''),
    link: Joi.string().regex(regexEnum.REGEXP_URL).allow(''),
    tag: Joi.array().items(Joi.string().min(1).max(50)).single().max(20),
    isStatic: Joi.boolean()
};

const addStaticEvent = customJoi.object(eventSchemaBase);

const deleteEvent = customJoi.object({
    groupId: Joi.string().required(),
    date: customJoi.stringDate().requireTime(false).required(),
    eventInfoId: Joi.string().required()
});

const editEvent = customJoi.object({
    groupId: Joi.string().required(),
    eventInfoId: Joi.string().required(),
    eventDateId: Joi.string().required(),
    date: customJoi.stringDate().requireTime(true),
    description: Joi.string().allow(''),
    duration: Joi.number().min(5).max(300),
    name: Joi.string().min(2).max(50),
    teacherName: Joi.string().min(2).max(50).allow(''),
    type: Joi.string().min(2).max(50).allow(''),
    color: Joi.string().regex(/^#[0-9a-fA-F]{6}$/).allow(''),
    place: Joi.string().min(2).max(50).allow(''),
    platform: Joi.string().min(2).max(50).allow(''),
    link: Joi.string().regex(regexEnum.REGEXP_URL).allow(''),
    tag: Joi.array().items(Joi.string().min(1).max(50)).single().max(20),
    isStatic: Joi.boolean().required()
});

const addDynamicEvent = customJoi.object(eventSchemaBase);

module.exports = {
    addStaticEvent,
    deleteEvent,
    editEvent,
    addDynamicEvent
};
