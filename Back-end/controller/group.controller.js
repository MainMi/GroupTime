const { FROENT_URL } = require('../config/config');
const { CONFIRM_USER } = require('../constant/type/actionTokenTypes.enum');
const { PUBLIC_TYPE } = require('../constant/type/groupTypes.enum');
const { CONFIRM_USER_TYPE, USER_JOINED_TYPE } = require('../constant/type/emailTypes.enum');
const { NOT_VERIFIED_TYPE, VERIFIED_TYPE } = require('../constant/type/verificateToken.enum');
const {
    USER_ROLE, ADMIN_ROLE, STUDENT_ROLE, HELP_ADMIN_ROLE, OWNER_ROLE,
} = require('../constant/user.role.enum');
const groupModel = require('../model/group.model');
const ApiError = require('../error/ErrorHandler');
const {
    ROLE_INCORRECT, OWNER_CANNOT_LEAVE, OWNER_CANNOT_BE_MODIFIED, USER_IN_GROUP_NOT_FOUND, PARAMS_IS_NOT_FOUND,
} = require('../error/errorMsg');
const {
    authService, userService, verificateService, emailService, avatarService,
} = require('../service');
const { groupService } = require('../service/schedule');

// All roles an admin may assign to a group member. OWNER_ROLE is intentionally
// excluded — ownership is only granted via the dedicated transfer endpoint.
const VALID_GROUP_ROLES = [
    USER_ROLE,
    STUDENT_ROLE,
    HELP_ADMIN_ROLE,
    ADMIN_ROLE
];

// Resolve the email of a group's owner (used for join notifications).
// Falls back to an admin for legacy groups created before the owner role existed.
const findGroupOwnerEmail = async (groupId) => {
    const ownerVerificate = await verificateService.findVerificateUser({
        group: groupId,
        role: OWNER_ROLE
    }) || await verificateService.findVerificateUser({
        group: groupId,
        role: ADMIN_ROLE
    });
    if (!ownerVerificate) return null;
    const owner = await userService.getUser({ _id: ownerVerificate.user });
    return owner?.email || null;
};

module.exports = {
    getGroupInfo: async (req, res, next) => {
        try {
            const { userInGroup } = req;

            const isAdmin = userInGroup.role === ADMIN_ROLE || userInGroup.role === OWNER_ROLE;

            const group = await groupService.getGroupById(userInGroup.group._id)
                .populate({
                    path: 'users',
                    select: isAdmin ? '-group +actionToken' : '-group -actionToken',
                    populate: {
                        path: 'user',
                        select: {
                            fullName: 1,
                            lastName: 1,
                            firstName: 1,
                            nickname: 1,
                            email: 1,
                            avatar: 1,
                            _id: 1,
                            createdAt: 1,
                            updatedAt: 1,
                        },
                        populate: { path: 'avatar', select: 'location' }
                    }
                })
                .populate({
                    path: 'schedule.static schedule.current',
                    select: '-groupId'
                });

            res.json(group).status(200);
        } catch (e) {
            next(e);
        }
    },
    createGroup: async (req, res, next) => {
        try {
            const {
                name,
                type,
                description,
            } = req.body;

            const { _id, groups } = req.authUser;

            const group = await groupService.createGroup({
                type,
                name,
                description,
                users: []
            });
            const verificate = await verificateService.createVerificateUser({
                group: group._id,
                user: _id,
                role: OWNER_ROLE,
                actionToken: null,
                type: VERIFIED_TYPE
            });
            // These two writes are independent — run them together to save a round-trip
            await Promise.all([
                userService.updateUser(_id, {
                    groups: [
                        ...groups,
                        verificate._id
                    ]
                }),
                groupService.updateUserGroup(group._id, verificate._id),
            ]);

            res.status(200).json(group);
        } catch (e) {
            next(e);
        }
    },
    editGroup: async (req, res, next) => {
        try {
            const { groupId, ...updateData } = req.body;

            const group = await groupService.updateGroup(groupId, updateData);

            res.status(200).json(group);
        } catch (e) {
            next(e);
        }
    },
    // Manager-only: upload a new group picture, add it to the group's gallery and
    // make it active. Mirrors userController.uploadUserAvatar via avatarService.
    uploadGroupAvatar: async (req, res, next) => {
        try {
            const groupId = req.userInGroup.group._id;
            const fileDoc = await avatarService.uploadAvatar(req.files.avatar, groupId, 'group');
            const location = await avatarService.applyGalleryUpload(groupModel, groupId, fileDoc);

            res.status(200).json({ location });
        } catch (e) {
            next(e);
        }
    },
    selectGroupAvatar: async (req, res, next) => {
        try {
            const groupId = req.userInGroup.group._id;
            const { fileId } = req.body;
            const ok = await avatarService.selectFromGallery(groupModel, groupId, fileId);
            if (!ok) {
                return next(new ApiError(...Object.values(PARAMS_IS_NOT_FOUND)));
            }
            res.status(200).json('Group avatar updated');
        } catch (e) {
            next(e);
        }
    },
    deleteGroupAvatar: async (req, res, next) => {
        try {
            const groupId = req.userInGroup.group._id;
            const { fileId } = req.body;
            const ok = await avatarService.removeFromGallery(groupModel, groupId, fileId);
            if (!ok) {
                return next(new ApiError(...Object.values(PARAMS_IS_NOT_FOUND)));
            }
            res.status(200).json('Group avatar removed');
        } catch (e) {
            next(e);
        }
    },
    deleteUserInGroup: async (req, res, next) => {
        try {
            const { userInGroup } = req;
            // The owner can't simply leave — they must transfer ownership first,
            // otherwise the group would be left without an owner.
            if (userInGroup.role === OWNER_ROLE) {
                return next(new ApiError(...Object.values(OWNER_CANNOT_LEAVE)));
            }
            await verificateService.deleteVerificateUser({ _id: userInGroup });
            res.status(200).json('User was deleted');
            next();
        } catch (e) {
            next(e);
        }
    },
    deleteGroup: async (req, res, next) => {
        try {
            const { group } = req;

            const userIds = group.users.map(({ user }) => user);
            await userService.updateUsers(userIds, { $inc: { groupCount: -1 } });
            await verificateService.deleteVerificateUsers({
                group: group._id
            });
            await groupService.deleteGroup(group._id);

            res.status(200).json('Group was deleted');
        } catch (e) {
            next(e);
        }
    },
    addUserToGroupPublic: async (req, res, next) => {
        try {
            const { group, authUser: user } = req;

            if (group.type === PUBLIC_TYPE) {
                const { _id: verificateId } = await verificateService.createVerificateUser({
                    group: group._id,
                    user: user._id,
                    role: STUDENT_ROLE,
                    actionToken: null,
                    type: VERIFIED_TYPE
                });

                await userService.updateUser(user._id, {
                    groups: [
                        ...user.groups,
                        verificateId
                    ]
                });

                await groupService.updateUserGroup(group._id, verificateId);

                res.json('User added to group');

                // Public join is instant — send the admin an informational
                // notification (only if the group enabled email notifications).
                if (group.parameters?.notifacionFromEmail) {
                    (async () => {
                        const ownerEmail = await findGroupOwnerEmail(group._id);
                        if (ownerEmail) {
                            await emailService.sendMail(
                                ownerEmail,
                                USER_JOINED_TYPE,
                                {
                                    userInfo: {
                                        fullName: user.fullName,
                                        nickname: user.nickname,
                                        email: user.email,
                                        groupName: group.name
                                    }
                                }
                            );
                        }
                    })().catch((e) => console.error('Join notification failed -', e.message));
                }
                return;
            }

            next();
        } catch (e) {
            next(e);
        }
    },
    // Self-join for non-public ("semi-public") groups: create a pending
    // (NOT_VERIFIED) membership and email the group admin a confirm/decline link.
    // The membership only becomes active once the admin confirms.
    addUserToGroupPrivate: async (req, res, next) => {
        try {
            const { group, authUser: user } = req;
            const actionToken = await authService.generateActionToken(
                { email: user.email },
                CONFIRM_USER
            );

            await authService.createActionToken({
                action_token: actionToken,
                action_type: CONFIRM_USER,
                userId: user._id
            });

            const { _id: verificateId } = await verificateService.createVerificateUser({
                group: group._id,
                user: user._id,
                role: USER_ROLE,
                actionToken,
                type: NOT_VERIFIED_TYPE
            });

            await userService.updateUser(user._id, {
                groups: [
                    ...user.groups,
                    verificateId
                ]
            });

            await groupService.updateUserGroup(group._id, verificateId);

            // Respond immediately — don't block the response on email delivery.
            res.json('User added to group');

            // Notify the group admin so they can confirm/decline the request
            // (unless the group disabled email notifications — then the admin can
            // only confirm via the site). Fire-and-forget.
            if (group.parameters?.notifacionFromEmail) {
                (async () => {
                    const ownerEmail = await findGroupOwnerEmail(group._id);
                    if (ownerEmail) {
                        const confirmURL = `${FROENT_URL}/group/confirm/user/?token=${actionToken}`;
                        const declineURL = `${FROENT_URL}/group/delete/user/?token=${actionToken}`;
                        await emailService.sendMail(
                            ownerEmail,
                            CONFIRM_USER_TYPE,
                            {
                                hrefs: [
                                    confirmURL,
                                    declineURL
                                ],
                                userInfo: {
                                    fullName: user.fullName,
                                    nickname: user.nickname,
                                    email: user.email,
                                    groupName: group.name
                                }
                            }
                        );
                    }
                })().catch((e) => console.error('Join-request email failed -', e.message));
            }
        } catch (e) {
            next(e);
        }
    },
    setConfirmUserToGroup: async (req, res, next) => {
        try {
            const { action_token: actionToken } = req.user;

            await verificateService.updateVerificateUser(
                { actionToken },
                {
                    $set: {
                        type: VERIFIED_TYPE,
                        actionToken: null
                    }
                }
            );

            res.json('success confirm user to group');
        } catch (e) {
            next(e);
        }
    },
    setConfirmAdminToGroup: async (req, res, next) => {
        try {
            const { action_token: actionToken } = req.user;

            await verificateService.updateVerificateUser(
                { actionToken },
                {
                    $set: {
                        type: VERIFIED_TYPE,
                        actionToken: null
                    }
                }
            );

            res.json('success confirm admin to group');
        } catch (e) {
            next(e);
        }
    },
    setDeleteUserToGroup: async (req, res, next) => {
        try {
            const { action_token } = req.user;
            await verificateService.deleteVerificateUser({ actionToken: action_token });

            res.status(200).json('user deleted success');
        } catch (e) {
            next(e);
        }
    },
    setGroupNewRoleUser: async (req, res, next) => {
        try {
            const { role: newRole, userId: user, groupId: group } = req.body;
            if (!VALID_GROUP_ROLES.includes(newRole)) {
                return next(new ApiError(...Object.values(ROLE_INCORRECT)));
            }
            // The owner's role can only change through the transfer endpoint.
            const target = await verificateService.findVerificateUser({ user, group });
            if (target?.role === OWNER_ROLE) {
                return next(new ApiError(...Object.values(OWNER_CANNOT_BE_MODIFIED)));
            }
            await verificateService.updateVerificateUser(
                { user, group },
                {
                    $set: {
                        role: newRole
                    }
                }
            );
            res.status(200).json('success added role to user');
        } catch (e) {
            next(e);
        }
    },
    // Owner-only: hand the OWNER_ROLE to another verified member and demote the
    // current owner to ADMIN_ROLE. Guarded by checkGroupUserRole(OWNER_ROLE).
    transferOwnership: async (req, res, next) => {
        try {
            const { userId: user, groupId: group } = req.body;
            const { _id: currentOwnerId } = req.authUser;

            // Transferring to yourself would race two $set updates on the same
            // membership and could leave the group with no owner — reject it.
            if (String(user) === String(currentOwnerId)) {
                return next(new ApiError(...Object.values(OWNER_CANNOT_BE_MODIFIED)));
            }

            const target = await verificateService.findVerificateUser({ user, group });
            if (!target || target.type !== VERIFIED_TYPE) {
                return next(new ApiError(...Object.values(USER_IN_GROUP_NOT_FOUND)));
            }

            await Promise.all([
                verificateService.updateVerificateUser(
                    { user, group },
                    { $set: { role: OWNER_ROLE } }
                ),
                verificateService.updateVerificateUser(
                    { user: currentOwnerId, group },
                    { $set: { role: ADMIN_ROLE } }
                ),
            ]);

            res.status(200).json('Ownership transferred');
        } catch (e) {
            next(e);
        }
    },
    // Admin removes a member from the group. The verificate findOneAndDelete hook
    // decrements counts and pulls the membership from group.users / user.groups.
    removeUserFromGroup: async (req, res, next) => {
        try {
            const { userId: user, groupId: group } = req.body;
            // Never let an admin kick the owner.
            const target = await verificateService.findVerificateUser({ user, group });
            if (target?.role === OWNER_ROLE) {
                return next(new ApiError(...Object.values(OWNER_CANNOT_BE_MODIFIED)));
            }
            await verificateService.deleteVerificateUser({ user, group });
            res.status(200).json('User removed from group');
        } catch (e) {
            next(e);
        }
    },
    searchGroup: (req, res, next) => {
        try {
            const { groupsInfo } = req;

            res.status(200).json(groupsInfo);
        } catch (e) {
            next(e);
        }
    }
};
