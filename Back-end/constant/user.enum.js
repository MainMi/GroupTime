// User-domain limits/config (role values live in user.role.enum.js).
module.exports = {
    // Auto-generated nicknames (e.g. Google sign-up): max length of the base taken
    // from the email local-part, and how many random suffixes to try on collision
    // before falling back to a timestamp suffix.
    NICKNAME_MAX_BASE_LENGTH: 20,
    NICKNAME_SUFFIX_ATTEMPTS: 5,
};
