const { resolveMagicActions } = require('../../helper/magicAction.helper');

// One group with a static "Math" event the edit tests can target.
const groups = [{
    id: 'g1',
    name: 'IP-21',
    weekData: {
        staticWeek: [{
            day: 'Пн',
            events: [{
                eventInfo: { _id: 'ei1', name: 'Math', teacherName: 'T' },
                eventDate: { _id: 'ed1', day: 'Пн', time: '8:30', duration: 90 },
            }],
        }],
        dynamicWeek: [],
    },
}];

describe('magicAction.resolveMagicActions', () => {
    test('resolves multiple create entries into independent actions', () => {
        const parsed = {
            actions: [
                { intent: 'create', scheduleType: 'static', groupName: 'IP-21', event: { name: 'Physics', day: 'Вв', time: '10:00', duration: 90 } },
                { intent: 'create', scheduleType: 'dynamic', groupName: 'IP-21', event: { name: 'Lab', date: '2026-06-30', time: '12:00', duration: 60 } },
            ],
        };
        const { actions } = resolveMagicActions(parsed, groups, 'uk');
        expect(actions).toHaveLength(2);
        expect(actions[0].kind).toBe('create');
        expect(actions[0].summary).toContain('Physics');
        expect(actions[1].scheduleType).toBe('dynamic');
    });

    test('drops entries with missing required fields and notes them in the reply', () => {
        const parsed = {
            actions: [
                { intent: 'create', scheduleType: 'static', groupName: 'IP-21', event: { name: 'Ok', day: 'Пн', time: '9:00' } },
                { intent: 'create', scheduleType: 'static', groupName: 'IP-21', event: { name: 'NoTime', day: 'Пн' } },
            ],
        };
        const { actions, reply } = resolveMagicActions(parsed, groups, 'uk');
        expect(actions).toHaveLength(1);
        expect(reply).toMatch(/час/i); // the note explains the missing time
    });

    test('resolves an edit against the existing event and carries edit metadata', () => {
        const parsed = {
            actions: [
                { intent: 'edit', groupName: 'IP-21', targetEventName: 'Math', event: { time: '10:00' } },
            ],
        };
        const { actions } = resolveMagicActions(parsed, groups, 'uk');
        expect(actions).toHaveLength(1);
        expect(actions[0].kind).toBe('edit');
        expect(actions[0].eventInfoId).toBe('ei1');
        expect(actions[0].eventDateId).toBe('ed1');
        expect(actions[0].event.time).toBe('10:00');
        expect(actions[0].scheduleType).toBe('static');
    });

    test('returns no actions for a non-create/edit request', () => {
        const { actions } = resolveMagicActions({ actions: [] }, groups, 'uk');
        expect(actions).toHaveLength(0);
    });
});
