const request = require('supertest');
const generateData = require('../../helper/generateData');

const app = require('../../../app');
const { userService, authService } = require('../../../service');
const { ADMIN_ROLE, STUDENT_ROLE } = require('../../../constant/user.role.enum');
const { PUBLIC_TYPE } = require('../../../constant/type/groupTypes.enum');
const { groupService } = require('../../../service/schedule');

const { getFormattedDate, getFormattedDateWithTime } = require('../../helper/getFormattedDate');

describe('Pair Controller - /api/schedule/event', () => {
    const user1 = generateData.createUser();
    const user2 = generateData.createUser();

    const group = generateData.createGroup({
        type: PUBLIC_TYPE
    });

    const eventInfosIds = {};
    const eventDateIds = {};
    const eventInfosDate = {};

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

        const groupId = group._id;

        const today = new Date();
        const formattedDate = getFormattedDate(today);

        const nextWeekDate = new Date(new Date().setDate(today.getDate() + 7));
        const formattedDateNextWeek = getFormattedDate(nextWeekDate);

        const addStaticWeekResponce1 = await request(app)
            .post('/api/schedule/week/add/static')
            .set({ Authorization: user1.token })
            .send({
                groupId
            });
        expect(addStaticWeekResponce1.status).toBe(200);

        const addStaticWeekResponce2 = await request(app)
            .post('/api/schedule/week/add/static')
            .set({ Authorization: user1.token })
            .send({
                groupId
            });
        expect(addStaticWeekResponce2.status).toBe(200);

        const addDynamicWeekResponce1 = await request(app)
            .post('/api/schedule/week/add/dynamic')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: formattedDate
            });
        expect(addDynamicWeekResponce1.status).toBe(200);

        const addDynamicWeekResponce2 = await request(app)
            .post('/api/schedule/week/add/dynamic')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: formattedDateNextWeek
            });
        expect(addDynamicWeekResponce2.status).toBe(200);
    });

    test('Creating static event', async () => {
        const groupId = group._id;

        const event = generateData.createPair();
        event.groupId = groupId;

        const response_createStaticEvent = await request(app)
            .post('/api/schedule/event/add/static')
            .set({ Authorization: user1.token })
            .send(event);
        expect(response_createStaticEvent.status).toBe(200);
        eventInfosIds.test1 = response_createStaticEvent.body.eventInfo;
        eventDateIds.test1 = response_createStaticEvent.body.eventDate;
        eventInfosDate.test1 = event.date;
    });

    test('Creating another static event', async () => {
        const groupId = group._id;

        const event = generateData.createPair();
        event.groupId = groupId;

        const response_createStaticEvent = await request(app)
            .post('/api/schedule/event/add/static')
            .set({ Authorization: user1.token })
            .send(event);
        expect(response_createStaticEvent.status).toBe(200);
        eventInfosIds.test2 = response_createStaticEvent.body.eventInfo;
        eventDateIds.test2 = response_createStaticEvent.body.eventDate;
        eventInfosDate.test2 = event.date;
    });

    test('Creating static event not admin', async () => {
        const groupId = group._id;

        const event = generateData.createPair();
        event.groupId = groupId;

        const response_createStaticEvent = await request(app)
            .post('/api/schedule/event/add/static')
            .set({ Authorization: user2.token })
            .send(event);
        expect(response_createStaticEvent.status).toBe(403);
    });

    test('Creating static event without params', async () => {
        const event = generateData.createPair();

        const response_createStaticEvent = await request(app)
            .post('/api/schedule/event/add/static')
            .set({ Authorization: user1.token })
            .send(event);
        expect(response_createStaticEvent.status).toBe(404);
    });

    test('Creating static event invalid week', async () => {
        const groupId = group._id;

        const event = generateData.createPair();
        event.groupId = groupId;
        event.date = 'something';

        const response_createStaticEvent = await request(app)
            .post('/api/schedule/event/add/static')
            .set({ Authorization: user1.token })
            .send(event);
        expect(response_createStaticEvent.status).toBe(404);
    });

    test('Creating dynamic event', async () => {
        const groupId = group._id;

        const event = generateData.createPair();
        event.groupId = groupId;

        const response_createDynamicEvent = await request(app)
            .post('/api/schedule/event/add/dynamic')
            .set({ Authorization: user1.token })
            .send(event);
        expect(response_createDynamicEvent.status).toBe(200);
        eventInfosIds.test3 = response_createDynamicEvent.body.eventInfo;
        eventDateIds.test3 = response_createDynamicEvent.body.eventDate;
        eventInfosDate.test3 = event.date;
    });

    test('Creating another dynamic event', async () => {
        const groupId = group._id;

        const event = generateData.createPair();
        event.groupId = groupId;

        const response_createDynamicEvent = await request(app)
            .post('/api/schedule/event/add/dynamic')
            .set({ Authorization: user1.token })
            .send(event);
        expect(response_createDynamicEvent.status).toBe(200);
        eventInfosIds.test4 = response_createDynamicEvent.body.eventInfo;
        eventDateIds.test4 = response_createDynamicEvent.body.eventDate;
        eventInfosDate.test4 = event.date;
    });

    test('Creating dynamic event not admin', async () => {
        const groupId = group._id;

        const event = generateData.createPair();
        event.groupId = groupId;

        const response_createDynamicEvent = await request(app)
            .post('/api/schedule/event/add/dynamic')
            .set({ Authorization: user2.token })
            .send(event);
        expect(response_createDynamicEvent.status).toBe(403);
    });

    test('Creating dynamic event without params', async () => {
        const event = generateData.createPair();

        const response_createDynamicEvent = await request(app)
            .post('/api/schedule/event/add/dynamic')
            .set({ Authorization: user1.token })
            .send(event);
        expect(response_createDynamicEvent.status).toBe(404);
    });

    test('Creating dynamic event invalid week', async () => {
        const groupId = group._id;

        const event = generateData.createPair();
        event.groupId = groupId;
        event.date = 'something';

        const response_createDynamicEvent = await request(app)
            .post('/api/schedule/event/add/dynamic')
            .set({ Authorization: user1.token })
            .send(event);
        expect(response_createDynamicEvent.status).toBe(404);
    });

    test('Edit static event', async () => {
        const groupId = group._id;

        const newEventInfoData = generateData.generateEventInfoData();
        newEventInfoData.groupId = groupId;
        newEventInfoData.eventInfoId = eventInfosIds.test1;
        newEventInfoData.eventDateId = eventDateIds.test1;
        newEventInfoData.isStatic = true;
        newEventInfoData.date = eventInfosDate.test1;
        newEventInfoData.duration = 90;

        const response_editStaticEvent = await request(app)
            .post('/api/schedule/event/edit')
            .set({ Authorization: user1.token })
            .send(newEventInfoData);
        expect(response_editStaticEvent.status).toBe(200);
    });

    test('Edit another static event', async () => {
        const groupId = group._id;

        const newEventInfoData = generateData.generateEventInfoData();
        newEventInfoData.groupId = groupId;
        newEventInfoData.eventInfoId = eventInfosIds.test2;
        newEventInfoData.eventDateId = eventDateIds.test2;
        newEventInfoData.isStatic = true;
        newEventInfoData.date = eventInfosDate.test2;
        newEventInfoData.duration = 90;

        const response_editStaticEvent = await request(app)
            .post('/api/schedule/event/edit')
            .set({ Authorization: user1.token })
            .send(newEventInfoData);
        expect(response_editStaticEvent.status).toBe(200);
    });

    test('Edit dynamic event', async () => {
        const groupId = group._id;

        const newEventInfoData = generateData.generateEventInfoData();
        newEventInfoData.groupId = groupId;
        newEventInfoData.eventInfoId = eventInfosIds.test3;
        newEventInfoData.eventDateId = eventDateIds.test3;
        newEventInfoData.isStatic = false;
        newEventInfoData.date = eventInfosDate.test3;
        newEventInfoData.duration = 90;

        const response_editDynamicEvent = await request(app)
            .post('/api/schedule/event/edit')
            .set({ Authorization: user1.token })
            .send(newEventInfoData);
        expect(response_editDynamicEvent.status).toBe(200);
    });

    test('Edit another dynamic event', async () => {
        const groupId = group._id;

        const newEventInfoData = generateData.generateEventInfoData();
        newEventInfoData.groupId = groupId;
        newEventInfoData.eventInfoId = eventInfosIds.test4;
        newEventInfoData.eventDateId = eventDateIds.test4;
        newEventInfoData.isStatic = false;
        newEventInfoData.date = eventInfosDate.test4;
        newEventInfoData.duration = 90;

        const response_editDynamicEvent = await request(app)
            .post('/api/schedule/event/edit')
            .set({ Authorization: user1.token })
            .send(newEventInfoData);
        expect(response_editDynamicEvent.status).toBe(200);
    });

    test('Edit event multiple times', async () => {
        const groupId = group._id;

        const newEventInfoData = generateData.generateEventInfoData();
        newEventInfoData.groupId = groupId;
        newEventInfoData.eventInfoId = eventInfosIds.test1;
        newEventInfoData.eventDateId = eventDateIds.test1;
        newEventInfoData.isStatic = true;
        newEventInfoData.date = eventInfosDate.test1;
        newEventInfoData.duration = 90;

        const response_editPair = await request(app)
            .post('/api/schedule/event/edit')
            .set({ Authorization: user1.token })
            .send(newEventInfoData);
        expect(response_editPair.status).toBe(200);
    });

    test('Edit event not admin', async () => {
        const groupId = group._id;

        const newEventInfoData = generateData.generateEventInfoData();
        newEventInfoData.groupId = groupId;
        newEventInfoData.eventInfoId = eventInfosIds.test1;

        const response_editPair = await request(app)
            .post('/api/schedule/event/edit')
            .set({ Authorization: user2.token })
            .send(newEventInfoData);
        expect(response_editPair.status).toBe(403);
    });

    test('Edit event missing params', async () => {
        const newEventInfoData = generateData.generateEventInfoData();

        const response_editPair = await request(app)
            .post('/api/schedule/event/edit')
            .set({ Authorization: user1.token })
            .send(newEventInfoData);
        expect(response_editPair.status).toBe(404);
    });

    test('Delete static event', async () => {
        const groupId = group._id;
        const eventInfoId = eventInfosIds.test1;

        const response_deleteStaticEvent = await request(app)
            .post('/api/schedule/event/delete/static')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: eventInfosDate.test1,
                eventInfoId
            });
        expect(response_deleteStaticEvent.status).toBe(200);
    });

    test('Delete static event not admin', async () => {
        const groupId = group._id;
        const eventInfoId = eventInfosIds.test2;

        const response_deleteStaticEvent = await request(app)
            .post('/api/schedule/event/delete/static')
            .set({ Authorization: user2.token })
            .send({
                groupId,
                date: eventInfosDate.test2,
                eventInfoId
            });
        expect(response_deleteStaticEvent.status).toBe(403);
    });

    test('Delete static event missing params', async () => {
        const response_deleteStaticEvent = await request(app)
            .post('/api/schedule/event/delete/static')
            .set({ Authorization: user1.token })
            .send({});
        expect(response_deleteStaticEvent.status).toBe(404);
    });

    test('Delete dynamic event', async () => {
        const groupId = group._id;
        const eventInfoId = eventInfosIds.test3;

        const response_deleteDynamicEvent = await request(app)
            .post('/api/schedule/event/delete/dynamic')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: eventInfosDate.test3,
                eventInfoId
            });
        expect(response_deleteDynamicEvent.status).toBe(200);
    });

    test('Delete another static event', async () => {
        const groupId = group._id;
        const eventInfoId = eventInfosIds.test2;

        const response_deleteStaticEvent = await request(app)
            .post('/api/schedule/event/delete/static')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: eventInfosDate.test2,
                eventInfoId
            });
        expect(response_deleteStaticEvent.status).toBe(200);
    });

    test('Delete static event not exist', async () => {
        const groupId = group._id;
        const eventInfoId = eventInfosIds.test2;

        const response_deleteStaticEvent = await request(app)
            .post('/api/schedule/event/delete/static')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: eventInfosDate.test2,
                eventInfoId
            });
        expect(response_deleteStaticEvent.status).toBe(404);
    });

    test('Delete dynamic event not admin', async () => {
        const groupId = group._id;
        const eventInfoId = eventInfosIds.test4;

        const response_deleteDynamicEvent = await request(app)
            .post('/api/schedule/event/delete/dynamic')
            .set({ Authorization: user2.token })
            .send({
                groupId,
                date: eventInfosDate.test3,
                eventInfoId
            });
        expect(response_deleteDynamicEvent.status).toBe(403);
    });

    test('Delete dynamic event missing params', async () => {
        const response_deleteDynamicEvent = await request(app)
            .post('/api/schedule/event/delete/dynamic')
            .set({ Authorization: user1.token })
            .send({});
        expect(response_deleteDynamicEvent.status).toBe(404);
    });

    test('Delete another dynamic event', async () => {
        const groupId = group._id;
        const eventInfoId = eventInfosIds.test4;

        const response_deleteDynamicEvent = await request(app)
            .post('/api/schedule/event/delete/dynamic')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: eventInfosDate.test4,
                eventInfoId
            });
        expect(response_deleteDynamicEvent.status).toBe(200);
    });

    test('Delete dynamic event not exist', async () => {
        const groupId = group._id;
        const eventInfoId = eventInfosIds.test3;

        const response_deleteDynamicEvent = await request(app)
            .post('/api/schedule/event/delete/dynamic')
            .set({ Authorization: user1.token })
            .send({
                groupId,
                date: eventInfosDate.test4,
                eventInfoId
            });
        expect(response_deleteDynamicEvent.status).toBe(404);
    });
});
