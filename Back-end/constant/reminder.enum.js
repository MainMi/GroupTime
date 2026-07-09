module.exports = {
    // Delivery channels a reminder can use. EMAIL is handled by the API directly;
    // TELEGRAM is relayed to the gitignored bot service.
    REMINDER_CHANNELS: {
        EMAIL: 'email',
        TELEGRAM: 'telegram',
    },
    // How many minutes before an event a reminder fires, by default.
    DEFAULT_REMINDER_OFFSET: 15,
    // Bounds for the "minutes before" offset (5 min .. 1 week).
    MIN_REMINDER_OFFSET: 5,
    MAX_REMINDER_OFFSET: 10080,
    // Safety cap so one user can't schedule unbounded jobs.
    MAX_REMINDERS_PER_USER: 200,
    // agenda job name.
    REMINDER_JOB: 'send-reminder',
    // Lifetime of the one-time Telegram account-linking token.
    TELEGRAM_LINK_TTL: '30m',
};
