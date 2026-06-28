const router = require('express').Router();

const { FIND_TYPE } = require('../../constant/type/fileType.enum');
const { ADMIN_ROLE } = require('../../constant/user.role.enum');
const {
    authMiddleware,
    userMiddleware,
    groupMiddleware,
    scheduleMiddleware
} = require('../../middleware');

const {
    addStaticEvent,
    addDynamicEvent,
    deleteStaticEvent,
    deleteDynamicEvent,
    editEvent
} = require('../../controller/eventInfo.controller');

const { addFileEventDate, deleteFileEventDate } = require('../../controller/eventDate.controller');
const { eventValidator } = require('../../validator');
const { GROUP_INFO } = require('../../constant/type/populateType.enum');

router.post(
    '/add/file',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupParamRole('assistantCommandRole', ADMIN_ROLE),
    userMiddleware.checkValidFileParam('data', FIND_TYPE),
    addFileEventDate
);

router.post(
    '/delete/file',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupParamRole('assistantCommandRole', ADMIN_ROLE),
    deleteFileEventDate
);

router.post(
    '/add/static',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupParamRole('assistantCommandRole', ADMIN_ROLE),
    scheduleMiddleware.checkParams(eventValidator.addStaticEvent),
    scheduleMiddleware.isWeekExist(false, false, true),
    addStaticEvent
);

router.post(
    '/add/dynamic',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupParamRole('assistantCommandRole', ADMIN_ROLE),
    scheduleMiddleware.checkParams(eventValidator.addDynamicEvent),
    addDynamicEvent
);

router.post(
    '/delete/static',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupParamRole('assistantCommandRole', ADMIN_ROLE),
    scheduleMiddleware.checkParams(eventValidator.deleteEvent),
    scheduleMiddleware.isEventInfoExist,
    deleteStaticEvent
);

router.post(
    '/delete/dynamic',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupParamRole('assistantCommandRole', ADMIN_ROLE),
    scheduleMiddleware.checkParams(eventValidator.deleteEvent),
    scheduleMiddleware.isEventInfoExist,
    deleteDynamicEvent
);

router.post(
    '/edit',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupParamRole('assistantCommandRole', ADMIN_ROLE),
    scheduleMiddleware.checkParams(eventValidator.editEvent),
    editEvent
);

module.exports = router;
