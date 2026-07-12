const router = require('express').Router();

const {
    weekRouter,
    eventRouter,
    exportRouter,
    reminderRouter,
    availabilityRouter,
} = require('./schedule');

router.use('/week', weekRouter);
router.use('/event', eventRouter);
router.use('/export', exportRouter);
router.use('/reminder', reminderRouter);
router.use('/availability', availabilityRouter);

module.exports = router;
