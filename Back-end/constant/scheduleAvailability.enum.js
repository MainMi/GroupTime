// Bounds for the "common free slot" finder. A free window is only looked for
// inside the working day and must be at least MIN_SLOT_MINUTES long to be useful.
module.exports = {
    DAY_START: '08:00', // earliest time of day a free slot may start
    DAY_END: '22:00', // latest time of day a free slot may end
    MIN_SLOT_MINUTES: 30, // shorter free gaps are ignored
};
