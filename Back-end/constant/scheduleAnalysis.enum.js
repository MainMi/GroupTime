// Thresholds for the deterministic schedule analyzer — tuned for a university day.
module.exports = {
    GAP_THRESHOLD: 150, // a free window (minutes) longer than this is flagged
    OVERLOAD_COUNT: 6, // more events than this in one day is "overloaded"
};
