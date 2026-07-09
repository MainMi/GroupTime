const Agenda = require('agenda');
const axios = require('axios');
const jwt = require('jsonwebtoken');

const config = require('../config/config');
const logger = require('../config/logger');
const reminderModel = require('../model/reminder.model');
const emailService = require('./email.service');
const eventDateService = require('./schedule/eventDate.service');
const groupService = require('./schedule/group.service');
const scheduleWeekService = require('./schedule/scheduleWeek.service');
const scheduleDate = require('../helper/scheduleDate.helper');
const { parseTimeToMinutes } = require('../helper/time.helper');
const { resolveLanguage } = require('../helper/lang.helper');
const reminderText = require('../constant/reminderText');
const { weekEnum } = require('../constant');
const {
    REMINDER_CHANNELS, REMINDER_JOB, MAX_REMINDERS_PER_USER, TELEGRAM_LINK_TTL,
} = require('../constant/reminder.enum');

const DAYS = Object.values(weekEnum);

let agenda = null;

// Resolve the absolute time a reminder should fire for its event: the next
// occurrence (respecting static recurrence / dynamic one-off) minus the offset.
// Re-reads the eventDate so edits to the event are reflected. Returns Date|null.
const computeNextRunAt = async (eventDateId, isStatic, groupId, offsetMinutes) => {
    const eventDate = await eventDateService.getOne(eventDateId);
    if (!eventDate) return null;

    const group = await groupService.getGroupParametersById(groupId);
    const gmt = group?.parameters?.gmt || 0;
    const staticCount = isStatic
        ? await scheduleWeekService.countStaticWeeks(groupId)
        : 0;

    const occurrence = scheduleDate.nextEventOccurrence({
        isStatic,
        countWeek: eventDate.countWeek,
        staticCount,
        dayIndex: DAYS.indexOf(eventDate.day),
        minutes: parseTimeToMinutes(eventDate.time),
    }, gmt);
    if (!occurrence) return null;

    return new Date(occurrence.getTime() - offsetMinutes * 60000);
};

// Deliver one reminder over its channels. Each channel is isolated so a failure
// in one (e.g. the Telegram relay is down) doesn't block the other.
const deliver = async (reminder) => {
    const { user, eventInfoId: event } = reminder;
    if (!user || !event) return;

    const eventDate = await eventDateService.getOne(reminder.eventDateId);
    const lang = resolveLanguage(user.language);
    const { subject, emailSubtitle, telegramText } = reminderText.build(lang, {
        name: event.name || 'Event',
        time: eventDate?.time || '',
        place: event.place || '',
        offset: reminder.offsetMinutes,
    });

    if (reminder.channels.includes(REMINDER_CHANNELS.EMAIL) && user.email) {
        try {
            await emailService.sendMail(user.email, 'reminder', { title: subject, subtitle: emailSubtitle });
        } catch (e) {
            logger.error({ err: e.message, reminder: reminder._id }, 'reminder email failed');
        }
    }

    if (reminder.channels.includes(REMINDER_CHANNELS.TELEGRAM)
        && user.telegramChatId && config.TELEGRAM_BOT_URL) {
        try {
            await axios.post(`${config.TELEGRAM_BOT_URL}/send`, {
                chatId: user.telegramChatId,
                text: telegramText,
            }, { headers: { 'x-relay-secret': config.TELEGRAM_RELAY_SECRET }, timeout: 8000 });
        } catch (e) {
            logger.error({ err: e.message, reminder: reminder._id }, 'reminder telegram failed');
        }
    }
};

// agenda job body: send every due reminder, then reschedule static ones to their
// next occurrence and drop dynamic (one-off) ones.
const processDueReminders = async () => {
    const due = await reminderModel.find({ nextRunAt: { $lte: new Date() } })
        .populate('user', 'email telegramChatId language')
        .populate('eventInfoId', 'name place')
        .limit(200);

    for (const reminder of due) {
        // eslint-disable-next-line no-await-in-loop
        await deliver(reminder);

        if (reminder.isStatic) {
            // eslint-disable-next-line no-await-in-loop
            const next = await computeNextRunAt(reminder.eventDateId, true, reminder.groupId, reminder.offsetMinutes,);
            if (next) {
                reminder.nextRunAt = next;
                // eslint-disable-next-line no-await-in-loop
                await reminder.save();
            } else {
                // eslint-disable-next-line no-await-in-loop
                await reminderModel.deleteOne({ _id: reminder._id });
            }
        } else {
            // eslint-disable-next-line no-await-in-loop
            await reminderModel.deleteOne({ _id: reminder._id });
        }
    }
};

module.exports = {
    // Start the scheduler: one recurring job scans due reminders each minute.
    // No-op under tests. Safe to call once at server startup.
    init: async () => {
        if (config.NODE_ENV === 'test' || agenda) return;
        agenda = new Agenda({ db: { address: config.MONGODB_URL, collection: 'agendaJobs' } });
        agenda.define(REMINDER_JOB, processDueReminders);
        await agenda.start();
        await agenda.every('1 minute', REMINDER_JOB);
        logger.info('Reminder scheduler started');
    },

    // Create/replace a reminder for (user, event, offset). Idempotent via the
    // unique index. Returns the reminder, or null if the event has no upcoming
    // occurrence (e.g. a dynamic event already in the past).
    createReminder: async (userId, {
        groupId, eventInfoId, eventDateId, offsetMinutes, channels, isStatic,
    }) => {
        const count = await reminderModel.countDocuments({ user: userId });
        if (count >= MAX_REMINDERS_PER_USER) {
            const err = new Error('Reminder limit reached');
            err.status = 429;
            throw err;
        }

        const nextRunAt = await computeNextRunAt(eventDateId, isStatic, groupId, offsetMinutes);
        if (!nextRunAt) return null;

        return reminderModel.findOneAndUpdate(
            { user: userId, eventInfoId, offsetMinutes },
            {
                $set: {
                    user: userId,
                    groupId,
                    eventInfoId,
                    eventDateId,
                    offsetMinutes,
                    channels: channels?.length ? channels : [REMINDER_CHANNELS.EMAIL],
                    isStatic,
                    nextRunAt,
                },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
        );
    },

    listReminders: (userId, groupId) => reminderModel
        .find(groupId ? { user: userId, groupId } : { user: userId })
        .populate('eventInfoId', 'name')
        .lean(),

    deleteReminder: (userId, reminderId) => reminderModel.deleteOne({ _id: reminderId, user: userId }),

    // One-time deep-link the user opens to connect Telegram. The (gitignored) bot
    // verifies this JWT with the shared secret and stores their chat id.
    buildTelegramLink: (userId) => {
        if (!config.TELEGRAM_BOT_USERNAME) return null;
        const token = jwt.sign({ userId: String(userId) }, config.TELEGRAM_LINK_SECRET, {
            expiresIn: TELEGRAM_LINK_TTL,
        });
        return `https://t.me/${config.TELEGRAM_BOT_USERNAME}?start=${token}`;
    },
};
