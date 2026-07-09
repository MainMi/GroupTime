const { groupService, exportService } = require('../service/schedule');
const { SELF_URL } = require('../config/config');

const feedUrl = (token) => `${SELF_URL}/api/schedule/export/${token}/calendar.ics`;

module.exports = {
    // A group member requests the subscription link; the token is created on the
    // first call and reused afterwards so the URL stays stable.
    getSubscribeUrl: async (req, res, next) => {
        try {
            const { groupId } = req.body;
            const token = await groupService.getOrCreateCalendarToken(groupId);
            if (!token) {
                res.status(404).json('Group not found');
                return;
            }
            res.json({ url: feedUrl(token), token });
        } catch (e) {
            next(e);
        }
    },

    // Rotate the token: old subscription URLs stop working.
    regenerateSubscribeUrl: async (req, res, next) => {
        try {
            const { groupId } = req.body;
            const token = await groupService.regenerateCalendarToken(groupId);
            res.json({ url: feedUrl(token), token });
        } catch (e) {
            next(e);
        }
    },

    // Public endpoint: calendar apps (Google/Outlook/Apple) fetch this with only
    // the token in the URL — no login. Returns text/calendar.
    getCalendar: async (req, res, next) => {
        try {
            const { token } = req.params;
            const group = await groupService.findGroupByCalendarToken(token);
            if (!group) {
                res.status(404).send('Calendar not found');
                return;
            }
            const icsText = await exportService.buildIcsForGroup(group);
            res.set('Content-Type', 'text/calendar; charset=utf-8');
            res.set('Content-Disposition', 'inline; filename="grouptime.ics"');
            res.send(icsText);
        } catch (e) {
            next(e);
        }
    },
};
