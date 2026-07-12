const router = require('express').Router();

const { authMiddleware, groupMiddleware, scheduleMiddleware } = require('../../middleware');
const { setRsvp, getRsvp } = require('../../controller/rsvp.controller');
const { eventValidator } = require('../../validator');
const { GROUP_INFO } = require('../../constant/type/populateType.enum');

// Any group member may respond to / read responses for an event in their group.
router.post(
    '/set',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    scheduleMiddleware.checkParams(eventValidator.setRsvp),
    setRsvp
);

router.post(
    '/get',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    scheduleMiddleware.checkParams(eventValidator.getRsvp),
    getRsvp
);

module.exports = router;
