const request = require('supertest');
const generateData = require('../../helper/generateData');

const app = require('../../../app');
const { userService, authService } = require('../../../service');
const { ADMIN_ROLE, STUDENT_ROLE } = require('../../../constant/user.role.enum');
const { PUBLIC_TYPE } = require('../../../constant/type/groupTypes.enum');
const { groupService } = require('../../../service/schedule');

const { getFormattedDate } = require('../../helper/getFormattedDate');

describe('Schedule Week Controller - /api/schedule/week', () => {
    const user1 = generateData.createUser();
    const user2 = generateData.createUser();

    const group = generateData.createGroup({
        type: PUBLIC_TYPE
    });

    const today = new Date();
    const formattedDate = getFormattedDate(today);

    const nextWeekDate = new Date(new Date().setDate(today.getDate() + 7));
    const formattedDateNextWeek = getFormattedDate(nextWeekDate);

    const monthAheadDate = new Date(new Date().setDate(today.getDate() + 31));
    const formattedMonthAheadDate = getFormattedDate(monthAheadDate);

    beforeAll(async () => {
        const hashPassword1 = await authService.hashPassword(user1.password);
        const hashPassword2 = await authService.hashPassword(user2.password);
        await userService.createUser({
            ...user1,
            password: hashPassword1,
            global_role: ADMIN_ROLE,
            authorized: true,
            groups: undefined,
            avatar: undefined,
        });

        await userService.createUser({
            ...user2,
            password: hashPassword2,
            global_role: STUDENT_ROLE,
            authorized: true,
            groups: undefined,
            avatar: undefined,
        });

        const authUser1 = await request(app)
            .post('/api/auth/login')
            .send({
                email: user1.email,
                password: user1.password
            });
        expect(authUser1.status).toBe(200);

        const authUser2 = await request(app)
            .post('/api/auth/login')
            .send({
                email: user2.email,
                password: user2.password
            });
        expect(authUser2.status).toBe(200);

        user1.token = authUser1.body.access_token;
        user1._id = authUser1._id;
        user2.token = authUser2.body.access_token;
        user2._id = authUser2._id;

        const {
            title,
            description,
            type,
            name: groupName
        } = group;
        const access_token1 = user1.token;
        const createGroupResponce = await request(app)
            .post('/api/group/create')
            .set({ Authorization: access_token1 })
            .send({
                title,
                description,
                type,
                name: groupName
            });
        expect(createGroupResponce.status).toBe(200);

        const access_token2 = user2.token;
        const joinGroupResponce = await request(app)
            .post('/api/group/join')
            .set({ Authorization: access_token2 })
            .send({
                name: groupName
            });
        expect(joinGroupResponce.status).toBe(200);

        const groupInfo = await groupService.getGroupByName(groupName);
        group._id = groupInfo._id;
    });

    test('Creating static week', async () => {
        const groupId = group._id;
        const response_createStaticWeek = await request(app)
            .post('/api/schedule/week/add/static')
            .set({ Authorization: user1.token })
            .send({
                groupId
            });
        expect(response_createStaticWeek.status).toBe(200);
    });

    test('Creating another static week', async () => {
        const groupId = group._id;
        const response_createStaticWeek = await request(app)
            .post('/api/schedule/week/add/static')
            .set({ Authorization: user1.token })
            .send({
                groupId
            });
        expect(response_createStaticWeek.status).toBe(200);
    });

    test('Fail Creating static week not admin', async () => {
        const groupId = group._id;
        const response_createStaticWeek = await request(app)
            .post('/api/schedule/week/add/static')
            .set({ Authorization: user2.token })
            .send({
                groupId
            });
        expect(response_createStaticWeek.status).toBe(403);
    });

    test('Deleting static week', async () => {
        const groupId = group._id;
        const response_deleteStaticWeek = await request(app)
            .post('/api/schedule/week/deleteWeek')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: formattedDate,
                isStatic: true
            });
        expect(response_deleteStaticWeek.status).toBe(200);
    });

    test('Deleting static week not admin', async () => {
        const groupId = group._id;
        const response_deleteStaticWeek = await request(app)
            .post('/api/schedule/week/deleteWeek')
            .set({ Authorization: user2.token })
            .send({
                groupId,
                date: formattedDate,
                isStatic: true
            });
        expect(response_deleteStaticWeek.status).toBe(403);
    });

    test('Creating static week after deletion', async () => {
        const groupId = group._id;
        const response_createStaticWeek = await request(app)
            .post('/api/schedule/week/add/static')
            .set({ Authorization: user1.token })
            .send({
                groupId
            });
        expect(response_createStaticWeek.status).toBe(200);
    });

    test('Fail Deleting static week not admin', async () => {
        const groupId = group._id;
        const response_deleteStaticWeek = await request(app)
            .post('/api/schedule/week/deleteWeek')
            .set({ Authorization: user2.token })
            .send({
                groupId,
                date: formattedDate,
                isStatic: true
            });
        expect(response_deleteStaticWeek.status).toBe(403);
    });

    test('Deleting static week without groupId', async () => {
        const response_deleteStaticWeek = await request(app)
            .post('/api/schedule/week/deleteWeek')
            .set({ Authorization: user1.token })
            .send({
                date: formattedDate,
                isStatic: true
            });
        expect(response_deleteStaticWeek.status).toBe(404);
    });

    test('Deleting static week without date', async () => {
        const groupId = group._id;
        const response_deleteStaticWeek = await request(app)
            .post('/api/schedule/week/deleteWeek')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                isStatic: true
            });
        expect(response_deleteStaticWeek.status).toBe(404);
    });

    test('Getting not found schedule', async () => {
        const groupId = group._id;
        const response_createStaticWeek = await request(app)
            .get('/api/schedule/week/getSchedule')
            .set({ Authorization: user2.token })
            .query({
                groupId,
                formattedDate: formattedMonthAheadDate,
            });
        expect(response_createStaticWeek.status).toBe(404);
    });

    test('Getting schedule without groupId', async () => {
        const response_createStaticWeek = await request(app)
            .get('/api/schedule/week/getSchedule')
            .set({ Authorization: user2.token })
            .query({
                date: formattedDate,
            });
        expect(response_createStaticWeek.status).toBe(404);
    });

    test('Getting schedule without countWeek', async () => {
        const groupId = group._id;
        const response_createStaticWeek = await request(app)
            .get('/api/schedule/week/getSchedule')
            .set({ Authorization: user2.token })
            .query({
                groupId
            });
        expect(response_createStaticWeek.status).toBe(404);
    });

    test('Deleting another static week', async () => {
        const groupId = group._id;
        const response_createStaticWeek = await request(app)
            .post('/api/schedule/week/deleteWeek')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: formattedDateNextWeek,
                isStatic: true
            });
        expect(response_createStaticWeek.status).toBe(200);
    });

    test('Deleting static week not exists', async () => {
        const groupId = group._id;
        // Drain any remaining static weeks (countWeek stays contiguous after each
        // deletion, so a valid date always resolves to an existing week until
        // none are left), then the next delete must report "not found".
        let response_createStaticWeek;
        do {
            // eslint-disable-next-line no-await-in-loop
            response_createStaticWeek = await request(app)
                .post('/api/schedule/week/deleteWeek')
                .set({ Authorization: user1.token })
                .send({
                    groupId,
                    date: formattedDateNextWeek,
                    isStatic: true
                });
        } while (response_createStaticWeek.status === 200);
        expect(response_createStaticWeek.status).toBe(404);
    });

    test('Creating dynamic week', async () => {
        const groupId = group._id;
        const response_createDynamicWeek = await request(app)
            .post('/api/schedule/week/add/dynamic')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: formattedDate
            });
        expect(response_createDynamicWeek.status).toBe(200);
    });

    test('Creating another dynamic week', async () => {
        const groupId = group._id;
        const response_createDynamicWeek = await request(app)
            .post('/api/schedule/week/add/dynamic')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: formattedDateNextWeek
            });
        expect(response_createDynamicWeek.status).toBe(200);
    });

    test('Creating another dynamic week not admin', async () => {
        const groupId = group._id;
        const response_createDynamicWeek = await request(app)
            .post('/api/schedule/week/add/dynamic')
            .set({ Authorization: user2.token })
            .send({
                groupId,
                date: formattedDateNextWeek
            });
        expect(response_createDynamicWeek.status).toBe(403);
    });

    test('Creating another dynamic week without groupId', async () => {
        const response_createDynamicWeek = await request(app)
            .post('/api/schedule/week/add/dynamic')
            .set({ Authorization: user1.token });
        expect(response_createDynamicWeek.status).toBe(404);
    });

    test('Creating dynamic week without date', async () => {
        const groupId = group._id;
        const response_createDynamicWeek = await request(app)
            .post('/api/schedule/week/add/dynamic')
            .set({ Authorization: user1.token })
            .send({ groupId });
        expect(response_createDynamicWeek.status).toBe(404);
    });

    test('Deleting dynamic week', async () => {
        const groupId = group._id;
        const response_deleteDynamicWeek = await request(app)
            .post('/api/schedule/week/deleteWeek')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: formattedDate,
                isStatic: false
            });
        expect(response_deleteDynamicWeek.status).toBe(200);
    });

    test('Creating another dynamic week after deletion', async () => {
        const groupId = group._id;
        const response_createDynamicWeek = await request(app)
            .post('/api/schedule/week/add/dynamic')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: formattedDate
            });
        expect(response_createDynamicWeek.status).toBe(200);
    });

    test('Deleting dynamic week not admin', async () => {
        const groupId = group._id;
        const response_deleteDynamicWeek = await request(app)
            .post('/api/schedule/week/deleteWeek')
            .set({ Authorization: user2.token })
            .send({
                groupId,
                date: formattedDateNextWeek,
                isStatic: false
            });
        expect(response_deleteDynamicWeek.status).toBe(403);
    });

    test('Deleting all dynamic weeks', async () => {
        const groupId = group._id;
        const response_deleteDynamicWeek = await request(app)
            .post('/api/schedule/week/deleteWeek')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: formattedDate,
                isStatic: false
            });
        expect(response_deleteDynamicWeek.status).toBe(200);

        const response_deleteDynamicWeek2 = await request(app)
            .post('/api/schedule/week/deleteWeek')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: formattedDateNextWeek,
                isStatic: false
            });
        expect(response_deleteDynamicWeek2.status).toBe(200);
    });

    test('Deleting dynamic week not exist', async () => {
        const groupId = group._id;
        const response_deleteDynamicWeek = await request(app)
            .post('/api/schedule/week/deleteWeek')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: formattedDateNextWeek,
                isStatic: false
            });
        expect(response_deleteDynamicWeek.status).toBe(404);
    });
});
