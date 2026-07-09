const router = require('express').Router();

const {
    weekRouter,
    eventRouter,
    exportRouter,
    reminderRouter,
} = require('./schedule');

router.use('/week', weekRouter);
router.use('/event', eventRouter);
router.use('/export', exportRouter);
router.use('/reminder', reminderRouter);

module.exports = router;
