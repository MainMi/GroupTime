// Order matters: permisionRole() ranks roles by their index in Object.values(),
// so OWNER_ROLE must stay last to remain the highest privilege level.
module.exports = {
    USER_ROLE: 'user',
    STUDENT_ROLE: 'student',
    HELP_ADMIN_ROLE: 'help_admin',
    ADMIN_ROLE: 'admin',
    OWNER_ROLE: 'owner',
};
