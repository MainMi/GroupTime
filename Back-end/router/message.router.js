const router = require('express').Router();

const { GROUP_AND_USERS_INFO } = require('../constant/type/populateType.enum');
const { sessionController } = require('../controller');
const messageController = require('../controller/message.controller');
const { scheduleMiddleware, authMiddleware } = require('../middleware');
const { messageValidator, messageAnalyzeValidator } = require('../validator');

router.post(
    '/send',
    authMiddleware.checkAccessToken(GROUP_AND_USERS_INFO),
    scheduleMiddleware.checkParams(messageValidator),
    sessionController.getActiveSession,
    messageController.getConversation
);

// Deterministic schedule analysis + AI explanation for the selected groups/week.
router.post(
    '/analyze',
    authMiddleware.checkAccessToken(GROUP_AND_USERS_INFO),
    scheduleMiddleware.checkParams(messageAnalyzeValidator),
    messageController.analyzeSchedule
);

router.get(
    '/getLast',
    authMiddleware.checkAccessToken(),
    messageController.getMessages
);

module.exports = router;
