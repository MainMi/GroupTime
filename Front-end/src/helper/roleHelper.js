import roleEnum from '../constants/roleEnum';

export const isOwner = (userRole) => userRole === roleEnum.OWNER_ROLE;

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
  getUserRoleInGroup,
  canManageGroup,
};

export default roleHelper;
