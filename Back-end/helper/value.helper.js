// Prefer a supplied value, fall back to another when it's undefined/null/empty.
const pick = (a, b) => (a !== undefined && a !== null && a !== '' ? a : b);

module.exports = { pick };
