const router = require('express').Router();

const { CONFIRM_USER, CONFIRM_ADMIN, INVITE_USER } = require('../constant/type/actionTokenTypes.enum');
const { NOT_FIND_TYPE } = require('../constant/type/findType.enum');
const { GROUP_INFO } = require('../constant/type/populateType.enum');
const { IMAGE_TYPE } = require('../constant/type/fileType.enum');
const { ADMIN_ROLE, OWNER_ROLE } = require('../constant/user.role.enum');
const { authController } = require('../controller');
const groupController = require('../controller/group.controller');
const { userMiddleware, authMiddleware, groupMiddleware } = require('../middleware');

router.post(
    '/info',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    groupMiddleware.isVerificateUser,
    groupController.getGroupInfo
);

router.get(
    '/search',
    groupMiddleware.isSearchValid,
    groupMiddleware.isGroupFindByQuery,
    groupController.searchGroup
);

router.post(
    '/create',
    authMiddleware.checkAccessToken(),
    groupMiddleware.isValidGroup,
    groupMiddleware.isGroupFind(),
    groupController.createGroup,
);

router.patch(
    '/edit',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(ADMIN_ROLE),
    groupController.editGroup,
);

router.post(
    '/avatar',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(ADMIN_ROLE),
    userMiddleware.checkValidFileParam('avatar', IMAGE_TYPE),
    groupController.uploadGroupAvatar,
);

router.post(
    '/avatar/select',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(ADMIN_ROLE),
    groupController.selectGroupAvatar,
);

router.delete(
    '/avatar',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(ADMIN_ROLE),
    groupController.deleteGroupAvatar,
);

router.post(
    '/join',
    authMiddleware.checkAccessToken(),
    groupMiddleware.isMaxUserGroups,
    groupMiddleware.isGroupFind(NOT_FIND_TYPE),
    groupMiddleware.rejectPersonalGroup,
    groupMiddleware.isLimitUsersForGroup,
    groupMiddleware.isGroupUser,
    groupController.addUserToGroupPublic,
    groupController.addUserToGroupPrivate
);

router.delete(
    '/leave',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isGroupFind(NOT_FIND_TYPE),
    groupMiddleware.isUserInGroup,
    groupController.deleteUserInGroup
);
router.delete(
    '/delete',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isGroupFind(NOT_FIND_TYPE),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(OWNER_ROLE),
    groupController.deleteGroup
);

router.get(
    '/confirm/user',
    authMiddleware.checkActionToken(CONFIRM_USER),
    groupController.setConfirmUserToGroup
);

router.post(
    '/invite/users',
    authMiddleware.checkAccessToken(GROUP_INFO),
    groupMiddleware.isValidInvites,
    groupMiddleware.isGroupFind(NOT_FIND_TYPE),
    groupMiddleware.rejectPersonalGroup,
    groupMiddleware.isUserInGroup,
    groupMiddleware.isLimitUsersForGroup,
    userMiddleware.checkGroupUserRole(ADMIN_ROLE),
    userMiddleware.isUsersIdValid,
    authController.sendInviteUsers
);

router.get(
    '/confirm/invite',
    authMiddleware.checkActionToken(INVITE_USER),
    groupController.setConfirmUserToGroup
);
router.get(
    '/delete/invite',
    authMiddleware.checkActionToken(INVITE_USER),
    groupController.setDeleteUserToGroup
);
router.get(
    '/confirm/admin',
    authMiddleware.checkActionToken(CONFIRM_ADMIN),
    groupController.setConfirmAdminToGroup
);
router.get(
    '/delete/user',
    authMiddleware.checkActionToken(CONFIRM_USER),
    groupController.setDeleteUserToGroup
);
router.get(
    '/delete/admin',
    authMiddleware.checkActionToken(CONFIRM_ADMIN),
    groupController.setDeleteUserToGroup
);
router.post(
    '/role/add',
    authMiddleware.checkAccessToken(GROUP_INFO),
    userMiddleware.isChangeYourself(),
    groupMiddleware.isUserInGroup,
    groupMiddleware.isVerificateUser,
    userMiddleware.checkGroupUserRole(ADMIN_ROLE),
    groupController.setGroupNewRoleUser
);

router.post(
    '/role/transfer',
    authMiddleware.checkAccessToken(GROUP_INFO),
    userMiddleware.isChangeYourself(),
    groupMiddleware.isUserInGroup,
    groupMiddleware.isVerificateUser,
    userMiddleware.checkGroupUserRole(OWNER_ROLE),
    groupController.transferOwnership
);

router.delete(
    '/user/remove',
    authMiddleware.checkAccessToken(GROUP_INFO),
    userMiddleware.isChangeYourself(),
    groupMiddleware.isUserInGroup,
    userMiddleware.checkGroupUserRole(ADMIN_ROLE),
    groupController.removeUserFromGroup
);

module.exports = router;
