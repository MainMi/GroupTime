import { REACT_APP_API_URL as api } from '../config/config';

const urlEnum = {
  // auth
  api,
  register: `${api}/users/create`,
  login: `${api}/auth/login`,
  refresh: `${api}/auth/refresh`,

  // user
  userInfo: `${api}/auth/userInfo`,
  userSearch: `${api}/users/find`,
  userUpdate: `${api}/users/update`,
  userTourComplete: `${api}/users/tour/complete`,
  userAvatar: `${api}/users/avatar`,
  userAvatarSelect: `${api}/users/avatar/select`,

  // group
  createGroup: `${api}/group/create`,
  editGroup: `${api}/group/edit`,
  leaveGroup: `${api}/group/leave`,
  deleteGroup: `${api}/group/delete`,
  groupInfo: `${api}/group/info`,
  groupSearch: `${api}/group/search`,
  groupJoin: `${api}/group/join`,
  groupAvatar: `${api}/group/avatar`,
  groupAvatarSelect: `${api}/group/avatar/select`,

  // invite & role
  inviteUsers: `${api}/group/invite/users`,
  acceptInvite: `${api}/group/confirm/invite`,
  deleteInvite: `${api}/group/delete/invite`,
  groupRoleAdd: `${api}/group/role/add`,
  groupRoleTransfer: `${api}/group/role/transfer`,
  groupUserRemove: `${api}/group/user/remove`,

  // confirm / action tokens
  confirmEmailUrl: `${api}/auth/confirm/email`,
  confirmGroupUrl: `${api}/auth/confirm/group`,
  declineGroupUrl: `${api}/auth/delete/group`,
  confirmAdminUrl: `${api}/group/confirm/admin`,
  declineAdminUrl: `${api}/group/delete/admin`,
  confirmUserUrl: `${api}/group/confirm/user`,
  declineUserUrl: `${api}/group/delete/user`,
  forgotPasswordUrl: `${api}/auth/forgot/password`,

  // schedule
  scheduleWeekInfo: `${api}/schedule/week/info`,
  scheduleWeekVersion: `${api}/schedule/week/version`,
  scheduleStaticWeeksList: `${api}/schedule/week/static/list`,
  scheduleAddStatic: `${api}/schedule/week/add/static`,
  scheduleAddDynamic: `${api}/schedule/week/add/dynamic`,
  scheduleDelete: `${api}/schedule/week/deleteWeek`,
  scheduleStaticSwap: `${api}/schedule/week/static/swap`,

  // event
  eventAddStatic: `${api}/schedule/event/add/static`,
  eventAddDynamic: `${api}/schedule/event/add/dynamic`,
  eventEdit: `${api}/schedule/event/edit`,
  eventDeleteStatic: `${api}/schedule/event/delete/static`,
  eventDeleteDynamic: `${api}/schedule/event/delete/dynamic`,
  eventAddFile: `${api}/schedule/event/add/file`,
  eventDeleteFile: `${api}/schedule/event/delete/file`,
  eventImport: `${api}/schedule/event/import`,

  // message
  messageSend: `${api}/message/send`,
  messageAnalyze: `${api}/message/analyze`,
  messageMagic: `${api}/message/magic`,
  messageOrganize: `${api}/message/organize`,
  messagePersist: `${api}/message/persist`,
  messageGetLast: `${api}/message/getLast`
};

export default urlEnum;
