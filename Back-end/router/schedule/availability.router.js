const router = require('express').Router();

const { STUDENT_ROLE } = require('../../constant/user.role.enum');
const { GROUP_INFO, GROUP_AND_USERS_INFO } = require('../../constant/type/populateType.enum');

const {
    authMiddleware,
    userMiddleware,
    groupMiddleware,
    scheduleMiddleware,
} = require('../../middleware');

const { availabilityController } = require('../../controller');
const { availabilityValidator } = require('../../validator');

// Common free slots across several of the requester's own group schedules.
// resolveOwnTargets drops any id the user isn't a member of, so no extra gate is
// needed — you can only probe your own groups.
router.post(
    '/slots',
    authMiddleware.checkAccessToken(GROUP_AND_USERS_INFO),
    scheduleMiddleware.checkParams(availabilityValidator.groupSlotsSchema),
    availabilityController.groupSlots
);

// A single member's availability across every group they belong to — only a
// co-member (student+) may ask, and only busy/free times are returned.
router.post(
    '/member',
    authMiddleware.checkAccessToken(GROUP_INFO),
    scheduleMiddleware.checkParams(availabilityValidator.memberSlotsSchema),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(STUDENT_ROLE),
    groupMiddleware.isTargetUserInGroup,
    availabilityController.memberSlots
);

module.exports = router;
