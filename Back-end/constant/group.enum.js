const {
    USER_ROLE, STUDENT_ROLE, HELP_ADMIN_ROLE, ADMIN_ROLE
} = require('./user.role.enum');

const BASIC_ROLE_USER = [
    STUDENT_ROLE,
    HELP_ADMIN_ROLE,
    ADMIN_ROLE
];

module.exports = {
    // Max groups a single user may join.
    MAX_USER_GROUPS: 5,
    // Roles assignable to configurable group parameters (createEventInfosRole,
    // assistantCommandRole). OWNER is excluded — it isn't a configurable level.
    BASIC_ROLE_USER,
    // Every role an admin may assign to a member. OWNER_ROLE is intentionally
    // excluded — ownership is only granted via the dedicated transfer endpoint.
    ASSIGNABLE_GROUP_ROLES: [USER_ROLE].concat(BASIC_ROLE_USER),
};
