const router = require('express').Router();

const { STUDENT_ROLE, ADMIN_ROLE } = require('../../constant/user.role.enum');

const {
    authMiddleware,
    userMiddleware,
    groupMiddleware,
    scheduleMiddleware
} = require('../../middleware');

const {
    getSchedule,
    getScheduleVersion,
    addStaticWeek,
    addDynamicWeek,
    deleteWeek,
    swapScheduleWeeks,
    swapStaticWeeks,
    getAllStaticWeeks
} = require('../../controller/scheduleWeek.controller');

const { weekValidator } = require('../../validator');
const { GROUP_INFO } = require('../../constant/type/populateType.enum');

router.post(
    '/static/list',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(STUDENT_ROLE),
    getAllStaticWeeks
);

router.post(
    '/info',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(STUDENT_ROLE),
    scheduleMiddleware.checkParams(weekValidator.getSchedule),
    getSchedule
);

// Lightweight cache change-detection: returns just the week's version.
router.post(
    '/version',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(STUDENT_ROLE),
    scheduleMiddleware.checkParams(weekValidator.getSchedule),
    getScheduleVersion
);

router.post(
    '/add/static',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(ADMIN_ROLE),
    addStaticWeek
);

router.post(
    '/add/dynamic',
    scheduleMiddleware.checkParams(weekValidator.getSchedule),
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(ADMIN_ROLE),
    scheduleMiddleware.isWeekExist(true),
    addDynamicWeek
);

router.post(
    '/deleteWeek',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(ADMIN_ROLE),
    scheduleMiddleware.checkParams(weekValidator.deleteWeekSchema),
    scheduleMiddleware.isWeekExist(false, true),
    deleteWeek
);

router.post(
    '/swap',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(ADMIN_ROLE),
    scheduleMiddleware.checkParams(weekValidator.swapWeeksSchema),
    scheduleMiddleware.isDynamicWeeksExist,
    scheduleMiddleware.checkWeekIndexesForSwapping,
    swapScheduleWeeks
);

router.post(
    '/static/swap',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(ADMIN_ROLE),
    scheduleMiddleware.checkParams(weekValidator.swapStaticWeeksSchema),
    swapStaticWeeks
);

module.exports = router;
