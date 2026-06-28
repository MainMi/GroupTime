// Normalize a string for comparison: coerce to string, trim, lowercase.
const norm = (s) => String(s || '').trim().toLowerCase();

module.exports = { norm };
