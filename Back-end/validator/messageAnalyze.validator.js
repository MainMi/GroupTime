const Joi = require('joi');

// Body for the "detect schedule problems" endpoint. Either a single `date`
// (one ISO week) or a `dateFrom`..`dateTo` range may be supplied.
const messageAnalyzeSchema = Joi.object({
    groupIds: Joi.array().items(Joi.string()).default([]),
    date: Joi.string(),
    dateFrom: Joi.string(),
    dateTo: Joi.string(),
    selectedDay: Joi.string().allow(null, ''),
    weekLabel: Joi.string().allow(null, ''),
}).or('date', 'dateFrom');

module.exports = messageAnalyzeSchema;
