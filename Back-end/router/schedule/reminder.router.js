const router = require('express').Router();

const {
    authMiddleware,
    groupMiddleware,
    scheduleMiddleware
} = require('../../middleware');
const {
    setReminder,
    listReminders,
    deleteReminder,
    getTelegramLink
} = require('../../controller/reminder.controller');
const { eventValidator } = require('../../validator');
const { GROUP_INFO } = require('../../constant/type/populateType.enum');

router.post(
    '/set',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    scheduleMiddleware.checkParams(eventValidator.setReminder),
    setReminder
);

router.post(
    '/list',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    scheduleMiddleware.checkParams(eventValidator.listReminders),
    listReminders
);

router.post(
    '/delete',
    authMiddleware.checkAccessToken(GROUP_INFO),
    scheduleMiddleware.checkParams(eventValidator.deleteReminder),
    deleteReminder
);

// Deep-link to connect Telegram for reminder delivery.
router.get(
    '/telegram/link',
    authMiddleware.checkAccessToken(GROUP_INFO),
    getTelegramLink
);

module.exports = router;
