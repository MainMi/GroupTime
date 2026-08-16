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

// Google Identity Services sign-in/up. Must stay ABOVE the email guard below:
// the client sends only the Google ID token, and a first-time Google user has no
// account yet, so requiring `email` in the body and pre-loading that user would
// reject every sign-up.
router.post('/google', authController.googleAuth);

router.use(
    authMiddleware.emailValid,
    userMiddleware.getUserByDunamically('email')
);
router.post(
    '/login',
    authMiddleware.isLoginDataValid,
    authController.login
);
router.post('/forgot/password', authController.sendForgetPassword);

module.exports = router;
