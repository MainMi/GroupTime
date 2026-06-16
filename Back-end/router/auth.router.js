const router = require('express').Router();

const { FORGOT_PASSWORD, CONFIRM_EMAIL, INVITE_USER } = require('../constant/type/actionTokenTypes.enum');
const { GROUP_AND_USERS_INFO } = require('../constant/type/populateType.enum');
const { authController, userController } = require('../controller');
const groupController = require('../controller/group.controller');
const { authMiddleware, userMiddleware } = require('../middleware');

router.patch(
    '/forgot/password',
    authMiddleware.checkActionToken(FORGOT_PASSWORD),
    authController.setForgotPassword
);
router.get(
    '/confirm/email',
    authMiddleware.checkActionToken(CONFIRM_EMAIL),
    authController.setConfirmEmail
);
router.get(
    '/confirm/group',
    authMiddleware.checkActionToken(INVITE_USER),
    groupController.setConfirmUserToGroup
);
router.get(
    '/delete/group',
    authMiddleware.checkActionToken(INVITE_USER),
    groupController.setDeleteUserToGroup
);
router.post(
    '/userInfo',
    authMiddleware.checkAccessToken(GROUP_AND_USERS_INFO),
    userController.getUserInfo
);
router.post(
    '/refresh',
    authMiddleware.checkRefreshToken,
    authController.getNewTokenEvent
);

router.use(
    authMiddleware.emailValid,
    userMiddleware.getUserByDunamically('email')
);
router.post(
    '/login',
    authMiddleware.isLoginDataValid,
    authController.login
);
// Google Identity Services sign-in/up (verifies the ID token server-side).
router.post('/google', authController.googleAuth);
router.post('/forgot/password', authController.sendForgetPassword);

module.exports = router;
