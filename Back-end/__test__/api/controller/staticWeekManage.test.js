const request = require('supertest');
const generateData = require('../../helper/generateData');

const app = require('../../../app');
const { userService, authService } = require('../../../service');
const { ADMIN_ROLE } = require('../../../constant/user.role.enum');
const { PUBLIC_TYPE } = require('../../../constant/type/groupTypes.enum');
const { groupService } = require('../../../service/schedule');

const { getFormattedDateWithTime } = require('../../helper/getFormattedDate');
const scheduleDate = require('../../../helper/scheduleDate');

// Static week management: reorder (swap) + moving an event between static weeks
// via the edit endpoint. Static weeks rotate as ISO(date) % staticWeekCount.
describe('Static week management - /api/schedule/week', () => {
    const admin = generateData.createUser();
    const group = generateData.createGroup({ type: PUBLIC_TYPE });

    const today = new Date();
    // Pick a second date whose ISO-week parity differs from today's, so the two
    // dates resolve to two different static-week indexes (with 2 static weeks).
    const base = scheduleDate.getISOWeekNumber(today);
    let other = new Date(today);
    other.setDate(other.getDate() + 7);
    if (scheduleDate.getISOWeekNumber(other) % 2 === base % 2) {
        other = new Date(today);
        other.setDate(other.getDate() + 14);
    }

    const dateA = getFormattedDateWithTime(today);
    const dateB = getFormattedDateWithTime(other);
    const indexA = base % 2;
    const indexB = scheduleDate.getISOWeekNumber(other) % 2;

    const makeEvent = (date) => {
        const ev = generateData.generateEventInfoData();
        ev.groupId = group._id;
        ev.date = date;
        ev.duration = 90;
        return ev;
    };

    beforeAll(async () => {
        const hashPassword = await authService.hashPassword(admin.password);
        await userService.createUser({
            ...admin,
            password: hashPassword,
            global_role: ADMIN_ROLE,
            authorized: true,
            groups: undefined,
            avatar: undefined,
        });

        const auth = await request(app)
            .post('/api/auth/login')
            .send({ email: admin.email, password: admin.password });
        expect(auth.status).toBe(200);
        admin.token = auth.body.access_token;

        const createGroupRes = await request(app)
            .post('/api/group/create')
            .set({ Authorization: admin.token })
            .send({ name: group.name, description: group.description, type: group.type });
        expect(createGroupRes.status).toBe(200);

        const groupInfo = await groupService.getGroupByName(group.name);
        group._id = groupInfo._id;

        // Two static weeks → indexes 0 and 1
        for (let i = 0; i < 2; i += 1) {
            // eslint-disable-next-line no-await-in-loop
            const res = await request(app)
                .post('/api/schedule/week/add/static')
                .set({ Authorization: admin.token })
                .send({ groupId: group._id });
            expect(res.status).toBe(200);
        }
    });

    test('Lists the static weeks', async () => {
        const res = await request(app)
            .post('/api/schedule/week/static/list')
            .set({ Authorization: admin.token })
            .send({ groupId: group._id });
        expect(res.status).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body.length).toBe(2);
    });

    test('Moves an event to another static week via edit', async () => {
        // Create an event in the week that dateA maps to
        const created = await request(app)
            .post('/api/schedule/event/add/static')
            .set({ Authorization: admin.token })
            .send(makeEvent(dateA));
        expect(created.status).toBe(200);
        const { eventInfo, eventDate } = created.body;

        // It should be visible when querying dateA's week
        const before = await request(app)
            .post('/api/schedule/week/info')
            .set({ Authorization: admin.token })
            .send({ groupId: group._id, date: dateA });
        expect(before.status).toBe(200);
        expect(before.body.staticWeek).toBeDefined();

        // Edit with dateB → moves the event to the other static week
        const edited = await request(app)
            .post('/api/schedule/event/edit')
            .set({ Authorization: admin.token })
            .send({
                groupId: group._id,
                eventInfoId: eventInfo,
                eventDateId: eventDate,
                isStatic: true,
                date: dateB,
                duration: 90,
                name: 'Moved event',
            });
        expect(edited.status).toBe(200);

        // Now it should appear in dateB's week and be gone from dateA's week
        const afterB = await request(app)
            .post('/api/schedule/week/info')
            .set({ Authorization: admin.token })
            .send({ groupId: group._id, date: dateB });
        expect(afterB.status).toBe(200);
        expect(afterB.body.staticWeek).toBeDefined();

        const afterA = await request(app)
            .post('/api/schedule/week/info')
            .set({ Authorization: admin.token })
            .send({ groupId: group._id, date: dateA });
        expect(afterA.status).toBe(200);
        expect(afterA.body.staticWeek).toBeUndefined();

        // Sanity: the two dates really targeted different static-week indexes
        expect(indexA).not.toBe(indexB);
    });

    test('Swaps the order of two static weeks', async () => {
        const list = await request(app)
            .post('/api/schedule/week/static/list')
            .set({ Authorization: admin.token })
            .send({ groupId: group._id });
        expect(list.status).toBe(200);
        const [
            w1,
            w2
        ] = list.body;

        const res = await request(app)
            .post('/api/schedule/week/static/swap')
            .set({ Authorization: admin.token })
            .send({ groupId: group._id, weekId1: w1._id, weekId2: w2._id });
        expect(res.status).toBe(200);

        // After swap the event that was in indexB's week moves with it to indexA
        const afterA = await request(app)
            .post('/api/schedule/week/info')
            .set({ Authorization: admin.token })
            .send({ groupId: group._id, date: dateA });
        expect(afterA.status).toBe(200);
        expect(afterA.body.staticWeek).toBeDefined();
    });

    test('Swap rejects a non-admin', async () => {
        const list = await request(app)
            .post('/api/schedule/week/static/list')
            .set({ Authorization: admin.token })
            .send({ groupId: group._id });
        const [
            w1,
            w2
        ] = list.body;

        const res = await request(app)
            .post('/api/schedule/week/static/swap')
            .send({ groupId: group._id, weekId1: w1._id, weekId2: w2._id });
        // No token → unauthorized / forbidden (not a 200 success)
        expect(res.status).not.toBe(200);
    });
});
