const router = require('express').Router();

const {
    weekRouter,
    eventRouter,
    exportRouter,
    reminderRouter,
    availabilityRouter,
    rsvpRouter,
} = require('./schedule');

router.use('/week', weekRouter);
router.use('/event', eventRouter);
router.use('/export', exportRouter);
router.use('/reminder', reminderRouter);
router.use('/availability', availabilityRouter);
router.use('/rsvp', rsvpRouter);

module.exports = router;
