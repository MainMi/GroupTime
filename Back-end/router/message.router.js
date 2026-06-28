const router = require('express').Router();

const { GROUP_AND_USERS_INFO } = require('../constant/type/populateType.enum');
const { sessionController } = require('../controller');
const messageController = require('../controller/message.controller');
const { scheduleMiddleware, authMiddleware, userMiddleware } = require('../middleware');
const { messageValidator, messageAnalyzeValidator } = require('../validator');

const { gateAssistantCommands } = userMiddleware;

router.post(
    '/send',
    authMiddleware.checkAccessToken(GROUP_AND_USERS_INFO),
    scheduleMiddleware.checkParams(messageValidator),
    sessionController.getActiveSession,
    messageController.getConversation
);

router.post(
    '/magic',
    authMiddleware.checkAccessToken(GROUP_AND_USERS_INFO),
    scheduleMiddleware.checkParams(messageValidator),
    gateAssistantCommands('groundData.groupIds'),
    sessionController.getActiveSession,
    messageController.magic
);

// "/organizer": propose tags for the selected groups' events (gated like /magic).
router.post(
    '/organize',
    authMiddleware.checkAccessToken(GROUP_AND_USERS_INFO),
    scheduleMiddleware.checkParams(messageValidator),
    gateAssistantCommands('groundData.groupIds'),
    sessionController.getActiveSession,
    messageController.organize
);

// Deterministic schedule analysis + AI explanation for the selected groups/week.
router.post(
    '/analyze',
    authMiddleware.checkAccessToken(GROUP_AND_USERS_INFO),
    scheduleMiddleware.checkParams(messageAnalyzeValidator),
    gateAssistantCommands('groupIds'),
    messageController.analyzeSchedule
);

router.post(
    '/persist',
    authMiddleware.checkAccessToken(),
    sessionController.getActiveSession,
    messageController.persistMessages
);

router.get(
    '/getLast',
    authMiddleware.checkAccessToken(),
    messageController.getMessages
);

module.exports = router;
