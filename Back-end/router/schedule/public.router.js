const router = require('express').Router();

const { getPublicSchedule } = require('../../controller/export.controller');

// Public read-only schedule view, fetched by share token only — no auth. Kept in
// its own router (mounted before any auth middleware) so the token in the URL is
// the sole credential.
router.get('/:token', getPublicSchedule);

module.exports = router;
