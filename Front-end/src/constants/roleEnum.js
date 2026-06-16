const roleEnum = {
    USER_ROLE: 'user',
    STUDENT_ROLE: 'student',
    HELP_ADMIN_ROLE: 'help_admin',
    ADMIN_ROLE: 'admin',
    OWNER_ROLE: 'owner',
};

// Role hierarchy, low -> high. Used for permission comparisons
// (e.g. "can this role view/edit the schedule?").
export const ROLE_ORDER = [
    roleEnum.USER_ROLE,
    roleEnum.STUDENT_ROLE,
    roleEnum.HELP_ADMIN_ROLE,
    roleEnum.ADMIN_ROLE,
    roleEnum.OWNER_ROLE,
];

export default roleEnum;