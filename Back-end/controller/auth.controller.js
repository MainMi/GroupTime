const { FROENT_URL } = require('../config/config');

const {
    FORGOT_PASSWORD,
    CONFIRM_EMAIL,
    CONFIRM_ADMIN,
    CONFIRM_USER,
    INVITE_USER
} = require('../constant/type/actionTokenTypes.enum');

const {
    CONFIRM_TYPE,
    FORGOT_PASSWORD_TYPE,
    WELCOME_TYPE,
    CONFIRM_USER_TYPE,
    INVITE_USER_TYPE
} = require('../constant/type/emailTypes.enum');
const { NOT_VERIFIED_TYPE } = require('../constant/type/verificateToken.enum');
const ApiError = require('../error/ErrorHandler');
const { USER_IS_ALREADY_GROUP, GOOGLE_CREDENTIAL_MISSING, GOOGLE_EMAIL_NOT_VERIFIED } = require('../error/errorMsg');

const {
    emailService, userService, authService, verificateService, actionTokenService, tokenCacheService
} = require('../service');
const { groupService } = require('../service/schedule');

module.exports = {
    login: async (req, res, next) => {
        try {
            const { user, body: { password } } = req;

            await authService.comparePassword(password, user.password);

            const tokenPair = authService.generateTokenPair({ userId: user._id });
            await authService.createOauth(user._id, tokenPair);

            req.user = { user, ...tokenPair };

            user.password = undefined;

            res.json({
                user,
                ...tokenPair,
            }).status(200);
        } catch (e) {
            next(e);
        }
    },
    googleAuth: async (req, res, next) => {
        try {
            const { credential } = req.body;
            if (!credential) {
                return next(new ApiError(...Object.values(GOOGLE_CREDENTIAL_MISSING)));
            }

            const payload = await authService.verifyGoogleIdToken(credential);
            const {
                email,
                email_verified: emailVerified,
                sub: googleId,
                given_name: givenName,
                family_name: familyName
            } = payload;

            if (!email || !emailVerified) {
                return next(new ApiError(...Object.values(GOOGLE_EMAIL_NOT_VERIFIED)));
            }

            let user = await userService.getUserDoc({ email });

            if (user) {
                if (!user.googleId) {
                    await userService.updateUser(user._id, { googleId });
                    user.googleId = googleId;
                }
            } else {
                const nickname = await userService.getUniqueNickname(email);
                user = await userService.createUser({
                    email,
                    firstName: givenName || 'User',
                    lastName: familyName || givenName || 'User',
                    nickname,
                    googleId,
                    authProvider: 'google',
                    authorized: true
                });
            }

            const tokenPair = authService.generateTokenPair({ userId: user._id });
            await authService.createOauth(user._id, tokenPair);

            await userService.populateGroupsDetail(user);

            res.status(200).json({ user: user.toObject(), ...tokenPair });
        } catch (e) {
            next(e);
        }
    },
    logout: async (req, res, next) => {
        try {
            const { user } = req;

            await authService.deleteManyParamsToken({ userId: user.userId });
            // Drop the revoked tokens from the auth cache immediately.
            tokenCacheService.invalidateUser(user.userId);

            res.json('User is logout');
        } catch (e) {
            next(e);
        }
    },
    sendForgetPassword: async (req, res, next) => {
        try {
            const { user } = req;

            const forgotPasswordToken = await authService.generateActionToken({ email: user.email }, FORGOT_PASSWORD);

            await authService.createActionToken({
                action_token: forgotPasswordToken,
                action_type: FORGOT_PASSWORD,
                userId: user._id
            });

            const forgotPassURL = `${FROENT_URL}/password/forgot?token=${forgotPasswordToken}`;

            if (process.env.NODE_ENV !== 'test') {
                await emailService.sendMail(
                    user.email,
                    FORGOT_PASSWORD_TYPE,
                    { hrefs: [forgotPassURL] }
                );
            }

            res.send('send you gmail url for new password');
        } catch (e) {
            next(e);
        }
    },
    sendConfirmEmail: async (req, res, next) => {
        try {
            const { user } = req;

            const confirmEmailToken = await authService.generateActionToken({ email: user.email }, CONFIRM_EMAIL);

            await actionTokenService.createActionToken({
                action_token: confirmEmailToken,
                action_type: CONFIRM_EMAIL,
                userId: user._id
            });

            res.json('Please confirm email').status(200);

            if (process.env.NODE_ENV !== 'test') {
                const confirmEmailURL = `${FROENT_URL}/confirm/email/?token=${confirmEmailToken}`;

                await emailService.sendMail(user.email, CONFIRM_TYPE, { hrefs: [confirmEmailURL] });
            }
        } catch (e) {
            next(e);
        }
    },
    sendInviteUser: async (req, res, next) => {
        try {
            const { user, groupId, role } = req.body;

            const confirmEmailToken = await authService.generateActionToken({ userId: user._id, groupId, role }, INVITE_USER);

            await actionTokenService.createActionToken({
                action_token: confirmEmailToken,
                action_type: CONFIRM_EMAIL,
                userId: user._id
            });

            res.json('Please confirm email').status(200);
        } catch (e) {
            next(e);
        }
    },
    setForgotPassword: async (req, res, next) => {
        try {
            const { userId: user } = req.user;

            const hashPassword = await authService.hashPassword(req.body.password);

            await userService.updateUser(user._id, { password: hashPassword });

            res.json('success change password');
        } catch (e) {
            next(e);
        }
    },
    setConfirmEmail: async (req, res, next) => {
        try {
            const { userId: user } = req.user;

            await userService.updateUser(user._id, { authorized: true });

            if (process.env.NODE_ENV !== 'test') {
                await emailService.sendMail(user.email, WELCOME_TYPE);
            }

            res.json('successfully confirm email');
        } catch (e) {
            next(e);
        }
    },
    sendConfirmUser: async (req, res, next) => {
        try {
            const {
                email,
                _id: userId,
                fullName
            } = req.authUser;
            const { emailAdmin, group } = req;

            // eslint-disable-next-line object-shorthand
            const confirmUser = await authService.generateActionToken({ email: email }, CONFIRM_USER);

            await actionTokenService.createActionToken({
                action_token: confirmUser,
                action_type: CONFIRM_ADMIN,
                userId
            });

            const confirmUserURL = `${FROENT_URL}/group/confirm/admin/?token=${confirmUser}`;
            const deleteUserURL = `${FROENT_URL}/group/delete/admin/?token=${confirmUser}`;

            await emailService.sendMail(
                emailAdmin,
                CONFIRM_USER_TYPE,
                {
                    hrefs: [
                        confirmUserURL,
                        deleteUserURL
                    ],
                    userInfo: {
                        fullName,
                        email,
                        group: group.name
                    }
                }
            );
            res.json('Confired');
        } catch (e) {
            next(e);
        }
    },
    sendInviteUsers: async (req, res, next) => {
        try {
            const { users, body: { groupId, roles } } = req;
            const groupName = req.group.name;
            const groupDescription = req.group.description;
            const errors = [];
            const emailJobs = [];

            await Promise.all(users.map(async (user, index) => {
                const {
                    email,
                    _id: userId,
                    groups
                } = user;

                try {
                    const verificateUser = await verificateService.findVerificateUser({ user: userId, group: groupId });
                    if (verificateUser?.type) {
                        const { message } = USER_IS_ALREADY_GROUP;
                        errors.push({ userId, message });
                        return;
                    }

                    const inviteUser = await authService.generateActionToken(
                        { email, groupId, role: roles[index] },
                        INVITE_USER
                    );

                    await actionTokenService.createActionToken({
                        action_token: inviteUser,
                        action_type: INVITE_USER,
                        userId
                    });

                    const verificate = await verificateService.createVerificateUser({
                        group: groupId,
                        user: userId,
                        role: roles[index],
                        actionToken: inviteUser,
                        type: NOT_VERIFIED_TYPE
                    });

                    await Promise.all([
                        userService.updateUser(userId, {
                            groups: [
                                ...groups,
                                verificate._id
                            ]
                        }),
                        groupService.updateUserGroup(groupId, verificate._id),
                    ]);

                    emailJobs.push({ email, inviteUser });
                } catch (error) {
                    errors.push({ userId, message: error.message });
                }
            }));

            if (errors.length > 0) {
                res.status(207).json({ message: 'Completed with errors', errors });
            } else {
                res.json({ message: 'All users invited successfully' });
            }

            for (const job of emailJobs) {
                const confirmUserURL = `${FROENT_URL}/group/confirm/invite/?token=${job.inviteUser}`;
                const deleteUserURL = `${FROENT_URL}/group/delete/invite/?token=${job.inviteUser}`;
                emailService.sendMail(
                    job.email,
                    INVITE_USER_TYPE,
                    {
                        title: `Вас запрошує група «${groupName}»`,
                        hrefs: [
                            confirmUserURL,
                            deleteUserURL
                        ],
                        groupInfo: { name: groupName, description: groupDescription }
                    }
                ).catch((e) => console.error('Invite email failed for', job.email, '-', e.message));
            }
        } catch (e) {
            next(e);
        }
    },

    getNewTokenEvent: (req, res, next) => {
        try {
            const { tokenPair } = req;
            res.status(200).json({
                tokenPair
            });
        } catch (e) {
            next(e);
        }
    }
};
