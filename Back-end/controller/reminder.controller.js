const { reminderService } = require('../service');

module.exports = {
    setReminder: async (req, res, next) => {
        try {
            const reminder = await reminderService.createReminder(req.authUser._id, req.body);
            if (!reminder) {
                res.status(400).json('Event has no upcoming occurrence');
                return;
            }
            res.status(201).json(reminder);
        } catch (e) {
            next(e);
        }
    },

    listReminders: async (req, res, next) => {
        try {
            const list = await reminderService.listReminders(req.authUser._id, req.body.groupId);
            res.json(list);
        } catch (e) {
            next(e);
        }
    },

    deleteReminder: async (req, res, next) => {
        try {
            await reminderService.deleteReminder(req.authUser._id, req.body.reminderId);
            res.json('Deleted!');
        } catch (e) {
            next(e);
        }
    },

    // Deep-link the user opens to connect Telegram (bot service handles /start).
    getTelegramLink: (req, res, next) => {
        try {
            const url = reminderService.buildTelegramLink(req.authUser._id);
            if (!url) {
                res.status(503).json('Telegram bot is not configured');
                return;
            }
            res.json({ url });
        } catch (e) {
            next(e);
        }
    },
};
