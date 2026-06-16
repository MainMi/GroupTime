const router = require('express').Router();

const {
    weekRouter,
    eventRouter,
} = require('./schedule');

router.use('/week', weekRouter);
router.use('/event', eventRouter);

module.exports = router;
