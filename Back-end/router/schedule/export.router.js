const router = require('express').Router();

const { ADMIN_ROLE } = require('../../constant/user.role.enum');
const {
    authMiddleware,
    userMiddleware,
    groupMiddleware,
    scheduleMiddleware
} = require('../../middleware');
const {
    getSubscribeUrl,
    regenerateSubscribeUrl,
    getCalendar
} = require('../../controller/export.controller');
const { eventValidator } = require('../../validator');
const { GROUP_INFO } = require('../../constant/type/populateType.enum');

// Public feed: calendar apps (Google/Outlook/Apple) fetch this with only the
// token in the URL — no login. Must stay before any auth middleware.
router.get('/:token/calendar.ics', getCalendar);

// Any member can fetch the group's subscription link (created on first request).
router.post(
    '/subscribe',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    scheduleMiddleware.checkParams(eventValidator.subscribeCalendar),
    getSubscribeUrl
);

// Rotating the token revokes existing subscriptions — restrict to schedule editors.
router.post(
    '/revoke',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupParamRole('assistantCommandRole', ADMIN_ROLE),
    scheduleMiddleware.checkParams(eventValidator.subscribeCalendar),
    regenerateSubscribeUrl
);

module.exports = router;
