const router = require('express').Router();

const { IMAGE_TYPE } = require('../constant/type/fileType.enum');
const { userController, authController } = require('../controller');
const { userMiddleware, authMiddleware } = require('../middleware');

// eslint-disable-next-line function-paren-newline
router.post('/create',
    userMiddleware.isValidUser,
    userMiddleware.isUserLogin,
    userController.createUser,
    authController.sendConfirmEmail
);

router.use(authMiddleware.checkAccessToken());

router.post(
    '/avatar',
    userMiddleware.checkValidFileParam('avatar', IMAGE_TYPE),
    userController.uploadUserAvatar
);

router.post(
    '/avatar/select',
    userController.selectUserAvatar
);

router.delete(
    '/avatar',
    userController.deleteUserAvatar
);

router.post(
    '/update',
    userMiddleware.isValidUpdateUser,
    userController.updateUserInfo
);

router.post(
    '/tour/complete',
    userController.markTourComplete
);

router.get(
    '/find',
    userController.getUsersQuery
);

module.exports = router;
