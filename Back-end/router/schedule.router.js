const router = require('express').Router();

const {
    weekRouter,
    eventRouter,
    exportRouter,
} = require('./schedule');

router.use('/week', weekRouter);
router.use('/event', eventRouter);
router.use('/export', exportRouter);

module.exports = router;
