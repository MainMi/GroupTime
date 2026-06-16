const userModel = require('../model/user.model');
const ApiError = require('../error/ErrorHandler');
const { PARAMS_IS_NOT_FOUND } = require('../error/errorMsg');
const { userService, authService, avatarService } = require('../service');

module.exports = {
    createUser: async (req, res, next) => {
        try {
            const { password } = req.body;

            const hasPassword = await authService.hashPassword(password);

            const user = await userService.createUser({
                ...req.body,
                password: hasPassword,
                authorized: false,
                global_role: 'user'
            });

            req.user = user;
            next();
        } catch (e) {
            next(e);
        }
    },
    getUserInfo: (req, res) => {
        res.json(req.authUser);
    },

    updateUserInfo: async (req, res, next) => {
        try {
            const { _id } = req.authUser;
            const {
                firstName, lastName, phone, birthday, contacts
            } = req.body;

            const updateData = {};
            if (firstName !== undefined) updateData.firstName = firstName;
            if (lastName !== undefined) updateData.lastName = lastName;
            if (phone !== undefined) updateData.phone = phone;
            if (birthday !== undefined) updateData.birthday = new Date(birthday);
            if (contacts !== undefined) updateData.contacts = contacts;

            await userService.updateUser(_id, updateData);
            res.json({ message: 'Profile updated' });
        } catch (e) {
            next(e);
        }
    },

    // Mark the whole onboarding tour as finished (synced from the frontend once
    // every section is done or the user hits "Skip all").
    markTourComplete: async (req, res, next) => {
        try {
            await userService.updateUser(req.authUser._id, { tourCompleted: true });
            res.json({ message: 'Tour completed' });
        } catch (e) {
            next(e);
        }
    },

    getUsers: async (req, res) => {
        res.json(await userService.getUsers());
    },

    getUsersQuery: async (req, res) => {
        const { limit = 10, page = 1, text } = req.query;
        const users = await userService.getUsersQuery({ limit, page, text });

        res.json(users);
    },

    uploadUserAvatar: async (req, res, next) => {
        try {
            const { _id } = req.authUser;
            const fileDoc = await avatarService.uploadAvatar(req.files.avatar, _id, 'user');
            const location = await avatarService.applyGalleryUpload(userModel, _id, fileDoc);

            res.json({ location });
        } catch (e) {
            next(e);
        }
    },
    selectUserAvatar: async (req, res, next) => {
        try {
            const { _id } = req.authUser;
            const { fileId } = req.body;
            const ok = await avatarService.selectFromGallery(userModel, _id, fileId);
            if (!ok) {
                return next(new ApiError(...Object.values(PARAMS_IS_NOT_FOUND)));
            }
            res.json('Avatar updated');
        } catch (e) {
            next(e);
        }
    },
    deleteUserAvatar: async (req, res, next) => {
        try {
            const { _id } = req.authUser;
            const { fileId } = req.body;
            const ok = await avatarService.removeFromGallery(userModel, _id, fileId);
            if (!ok) {
                return next(new ApiError(...Object.values(PARAMS_IS_NOT_FOUND)));
            }
            res.json('Avatar removed');
        } catch (e) {
            next(e);
        }
    }
};
