const router = require('express').Router();

const {
    authRouter,
    groupRouter,
    userRouter,
    scheduleRouter,
    messageRouter
} = require('.');

router.use('/auth', authRouter);
router.use('/group', groupRouter);
router.use('/message', messageRouter);
router.use('/users', userRouter);
router.use('/schedule', scheduleRouter);

module.exports = router;
