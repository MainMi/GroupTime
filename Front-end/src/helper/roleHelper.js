import roleEnum, { ROLE_ORDER } from '../constants/roleEnum';

export const isOwner = (userRole) => userRole === roleEnum.OWNER_ROLE;

// Viewing a group's schedule requires STUDENT or above; a plain "user" (e.g. a
// not-yet-promoted member) has no schedule access.
export const canViewSchedule = (userRole) =>
  ROLE_ORDER.indexOf(userRole) >= ROLE_ORDER.indexOf(roleEnum.STUDENT_ROLE);

// Whether a membership may run assistant write-commands (/magic, /organizer):
// the role must meet the group's configurable `assistantCommandRole` (default admin).
export const canRunAssistantCommand = (groupVerificate) => {
  const required = groupVerificate?.group?.parameters?.assistantCommandRole || roleEnum.ADMIN_ROLE;
  return ROLE_ORDER.indexOf(groupVerificate?.role) >= ROLE_ORDER.indexOf(required);
};

export const isAdminOrHelpAdmin = (userRole) => {
  return (
    userRole === roleEnum.OWNER_ROLE ||
    userRole === roleEnum.ADMIN_ROLE ||
    userRole === roleEnum.HELP_ADMIN_ROLE
  );
};

/** @deprecated використовуйте isOwner */
export const isGroupOwner = (userRole) => isOwner(userRole);

export const canEditEvents = (userRole) => {
  return isAdminOrHelpAdmin(userRole);
};

export const getUserRoleInGroup = (userInfo, groupId) => {
  if (!userInfo?.groups || !groupId) return null;

  const groupMembership = userInfo.groups.find(
    (g) => g.group._id === groupId
  );

  return groupMembership ? groupMembership.role : null;
};

export const canManageGroup = (userRole) => {
  return userRole === roleEnum.OWNER_ROLE || userRole === roleEnum.ADMIN_ROLE;
};

const roleHelper = {
  isOwner,
  isAdminOrHelpAdmin,
  isGroupOwner,
  canEditEvents,
  canViewSchedule,
  canRunAssistantCommand,
  getUserRoleInGroup,
  canManageGroup,
};

export default roleHelper;
