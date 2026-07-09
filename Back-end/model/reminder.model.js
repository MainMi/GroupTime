const { Schema, model } = require('mongoose');
const { REMINDER_CHANNELS } = require('../constant/reminder.enum');

// A per-user reminder for one schedule event. Static (recurring) events keep the
// reminder alive by rescheduling nextRunAt after each fire; dynamic (one-off)
// events delete it once fired. `countWeek` is the event's static index or its
// dynamic ISO week, mirroring EventDate.
const ReminderSchema = new Schema({
    user: {
        type: Schema.Types.ObjectId, ref: 'User', required: true, index: true,
    },
    groupId: { type: Schema.Types.ObjectId, ref: 'Group', required: true },
    eventInfoId: { type: Schema.Types.ObjectId, ref: 'eventInfo', required: true },
    eventDateId: { type: Schema.Types.ObjectId, ref: 'eventDate', required: true },
    // Minutes before the event the reminder fires.
    offsetMinutes: { type: Number, required: true },
    channels: {
        type: [String],
        enum: Object.values(REMINDER_CHANNELS),
        default: [REMINDER_CHANNELS.EMAIL],
    },
    isStatic: { type: Boolean, required: true },
    countWeek: { type: Number, required: true },
    // Absolute instant the reminder should next fire (event time − offset).
    nextRunAt: { type: Date, index: true },
}, { timestamps: true });

// One reminder per (user, event, offset) so re-adding the same reminder is a no-op.
ReminderSchema.index({
    user: 1, eventInfoId: 1, offsetMinutes: 1,
}, { unique: true });

module.exports = model('Reminder', ReminderSchema);
