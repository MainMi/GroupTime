const mongoose = require('mongoose');
const { clearDB } = require('../mongo.config');
const importService = require('../../service/schedule/import.service');
const groupModel = require('../../model/group.model');
const eventInfoModel = require('../../model/eventInfo.model');
const eventDateModel = require('../../model/eventDate.model');
const scheduleWeekModel = require('../../model/scheduleWeek.model');

// DTSTART in the current ISO year so importEvents' year filter keeps the events.
const stamp = (date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d+Z$/, 'Z');
const NOW = new Date();
const LATER = new Date(NOW.getTime() + 3600000);

const SAMPLE_ICS = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Test//EN',
    'BEGIN:VEVENT',
    'UID:1@test',
    'SUMMARY:Team Standup',
    'DESCRIPTION:Daily sync',
    'LOCATION:Room 5',
    'DTSTART:20260706T090000Z',
    'DTEND:20260706T093000Z',
    'END:VEVENT',
    'BEGIN:VEVENT',
    'UID:2@test',
    'SUMMARY:Lecture',
    'DTSTART:20260707T120000Z',
    'DTEND:20260707T133000Z',
    'END:VEVENT',
    'END:VCALENDAR',
].join('\r\n');

describe('import.service parseIcs', () => {
    it('parses VEVENTs into normalized events', () => {
        const events = importService.parseIcs(SAMPLE_ICS);
        expect(events).toHaveLength(2);
        expect(events[0].name).toBe('Team Standup');
        expect(events[0].description).toBe('Daily sync');
        expect(events[0].place).toBe('Room 5');
        expect(events[0].start).toBeInstanceOf(Date);
        expect(events[0].end).toBeInstanceOf(Date);
    });

    it('ignores non-VEVENT content and invalid input gracefully', () => {
        expect(importService.parseIcs('not a calendar')).toEqual([]);
        expect(importService.parseIcs('BEGIN:VCALENDAR\r\nEND:VCALENDAR')).toEqual([]);
    });

    it('truncates over-long summaries to 50 chars', () => {
        const long = 'X'.repeat(80);
        const ics = SAMPLE_ICS.replace('Team Standup', long);
        const events = importService.parseIcs(ics);
        expect(events[0].name.length).toBe(50);
    });
});

describe('import.service importEvents', () => {
    const CURRENT_ICS = [
        'BEGIN:VCALENDAR',
        'VERSION:2.0',
        'BEGIN:VEVENT',
        'UID:cur-1@test',
        'SUMMARY:Standup',
        `DTSTART:${stamp(NOW)}`,
        `DTEND:${stamp(LATER)}`,
        'END:VEVENT',
        'BEGIN:VEVENT',
        'UID:cur-2@test',
        'SUMMARY:Lecture',
        `DTSTART:${stamp(LATER)}`,
        'END:VEVENT',
        'END:VCALENDAR',
    ].join('\r\n');

    let groupId;
    const userId = new mongoose.Types.ObjectId();

    beforeEach(async () => {
        await clearDB();
        const group = await groupModel.create({ name: 'Import test group' });
        groupId = group._id;
    });

    it('creates events with importUid and links them into the week', async () => {
        const events = importService.parseIcs(CURRENT_ICS);
        const imported = await importService.importEvents(groupId, events, userId, 0);

        expect(imported).toBe(2);
        const infos = await eventInfoModel.find({ importUid: { $exists: true } }).lean();
        expect(infos).toHaveLength(2);
        expect(infos.every((info) => info.importUid.startsWith(`${groupId}:`))).toBe(true);
        expect(await eventDateModel.countDocuments({})).toBe(2);

        const weeks = await scheduleWeekModel.find({ groupId, static: false }).lean();
        const linked = weeks.flatMap((week) => week.schedule.flatMap((day) => day.events));
        expect(linked).toHaveLength(2);
    });

    it('is idempotent: re-importing the same calendar creates nothing', async () => {
        const events = importService.parseIcs(CURRENT_ICS);
        await importService.importEvents(groupId, events, userId, 0);
        const again = await importService.importEvents(groupId, events, userId, 0);

        expect(again).toBe(0);
        expect(await eventInfoModel.countDocuments({ importUid: { $exists: true } })).toBe(2);
        expect(await eventDateModel.countDocuments({})).toBe(2);
    });

    it('imports only the new events when the calendar grew', async () => {
        const events = importService.parseIcs(CURRENT_ICS);
        await importService.importEvents(groupId, events, userId, 0);

        const grownIcs = CURRENT_ICS.replace('END:VCALENDAR', [
            'BEGIN:VEVENT',
            'UID:cur-3@test',
            'SUMMARY:Retro',
            `DTSTART:${stamp(NOW)}`,
            'END:VEVENT',
            'END:VCALENDAR',
        ].join('\r\n'));
        const imported = await importService.importEvents(groupId, importService.parseIcs(grownIcs), userId, 0);

        expect(imported).toBe(1);
        expect(await eventInfoModel.countDocuments({ importUid: { $exists: true } })).toBe(3);
    });
});
