const Joi = require('joi');

// Common free slots across several of the requester's own groups. Empty/absent
// `groupIds` means "all of my groups".
const groupSlotsSchema = Joi.object({
    groupIds: Joi.array().items(Joi.string()).default([]),
    date: Joi.string().required(),
});

// A single member's availability. The requester must share `groupId` with the
// target `userId` (enforced in middleware).
const memberSlotsSchema = Joi.object({
    groupId: Joi.string().required(),
    userId: Joi.string().required(),
    date: Joi.string().required(),
});

module.exports = {
    groupSlotsSchema,
    memberSlotsSchema,
};
