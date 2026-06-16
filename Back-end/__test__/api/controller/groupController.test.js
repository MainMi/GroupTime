const request = require('supertest');
const generateData = require('../../helper/generateData');

const app = require('../../../app');
const { userService, authService } = require('../../../service');
const { PUBLIC_TYPE, PRIVATE_TYPE } = require('../../../constant/type/groupTypes.enum');
const { USER_ROLE, ADMIN_ROLE } = require('../../../constant/user.role.enum');
const { groupService } = require('../../../service/schedule');
const actionTokenModel = require('../../../model/actionToken.model');
const { CONFIRM_USER } = require('../../../constant/type/actionTokenTypes.enum');

describe('Group Controller - /api/group', () => {
    const users = Array.from({ length: 3 }, () => generateData.createUser());
    const publicGroup = generateData.createGroup({
        type: PUBLIC_TYPE
    });
    const privateGroup = generateData.createGroup({
        type: PRIVATE_TYPE
    });

    beforeAll(async () => {
        await Promise.all(users.map(async (user, index) => {
            const hashPassword = await authService.hashPassword(user.password);
            const authUser = await userService.createUser({
                ...user,
                password: hashPassword,
                global_role: USER_ROLE,
                authorized: true,
                groups: undefined,
                avatar: undefined,
            });
            const response = await request(app)
                .post('/api/auth/login')
                .send({
                    email: user.email,
                    password: user.password
                });
            expect(response.status).toBe(200);

            users[index].token = response.body.access_token;
            users[index]._id = authUser._id;
        }));
    });

    test('Group Controller - create group', async () => {
        const {
            name,
            description,
            type,
        } = publicGroup;
        const access_token = users[0].token;
        const response = await request(app)
            .post('/api/group/create')
            .set({ Authorization: access_token })
            .send({
                name,
                description,
                type,
            });

        expect(response.status).toBe(200);
    });

    test('Group Controller - join in public group another user', async () => {
        const {
            name
        } = publicGroup;
        const access_token = users[1].token;
        const response = await request(app)
            .post('/api/group/join')
            .set({ Authorization: access_token })
            .send({
                name
            });
        expect(response.status).toBe(200);
    });

    test('Group Controller - info in group', async () => {
        const {
            name
        } = publicGroup;
        const { _id: groupId } = await groupService.getGroupByName(name);
        publicGroup.id = groupId;
        const access_token = users[1].token;
        const response = await request(app)
            .post('/api/group/info')
            .set({ Authorization: access_token })
            .send({
                groupId
            });
        expect(response.status).toBe(200);
    });

    test('Group Controller - create private', async () => {
        const {
            name,
            description,
            type,
        } = privateGroup;
        const access_token = users[2].token;
        const response = await request(app)
            .post('/api/group/create')
            .set({ Authorization: access_token })
            .send({
                name,
                description,
                type,
            });
        expect(response.status).toBe(200);
    });
    test('Group Controller - join in private group another user', async () => {
        const {
            name
        } = privateGroup;
        const access_token = users[1].token;
        const response = await request(app)
            .post('/api/group/join')
            .set({ Authorization: access_token })
            .send({
                name
            });
        expect(response.status).toBe(200);
    });
    test('Group Controller - info in private group', async () => {
        const {
            name
        } = privateGroup;
        const group = await groupService.getGroupByName(name);

        const access_token = users[2].token;
        const response = await request(app)
            .post('/api/group/info')
            .set({ Authorization: access_token })
            .send({
                groupId: group._id
            });
        expect(response.status).toBe(200);
    });
    test('Group Controller - info in group but user not vereficate', async () => {
        const {
            name
        } = privateGroup;
        const group = await groupService.getGroupByName(name);
        const access_token = users[1].token;
        const response = await request(app)
            .post('/api/group/info')
            .set({ Authorization: access_token })
            .send({
                groupId: group._id
            });
        expect(response.status).toBe(202);
    });

    test('Group Controller - delete user', async () => {
        const { action_token } = await actionTokenModel.findOne({ action_type: CONFIRM_USER });
        const response = await request(app)
            .get('/api/group/delete/user')
            .set({ Authorization: action_token })
            .send({});
        expect(response.status).toBe(200);
    });
    test('Group Controller - info in group but user deleted', async () => {
        const {
            name
        } = privateGroup;
        const group = await groupService.getGroupByName(name);
        const access_token = users[1].token;
        const response = await request(app)
            .post('/api/group/info')
            .set({ Authorization: access_token })
            .send({
                groupId: group._id
            });
        expect(response.status).toBe(404);
    });
    test('Group Controller - join in private group user after deleted', async () => {
        const {
            name
        } = privateGroup;
        const access_token = users[1].token;
        const response = await request(app)
            .post('/api/group/join')
            .set({ Authorization: access_token })
            .send({
                name
            });
        expect(response.status).toBe(200);
    });
    test('Group Controller - confirm user in private group', async () => {
        const { action_token } = await actionTokenModel.findOne({ action_type: CONFIRM_USER });
        const response = await request(app)
            .get('/api/group/confirm/user')
            .set({ Authorization: action_token })
            .send({});
        expect(response.status).toBe(200);
    });
    test('Group Controller - info in group after confired', async () => {
        const {
            name
        } = privateGroup;
        const group = await groupService.getGroupByName(name);
        const access_token = users[1].token;
        const response = await request(app)
            .post('/api/group/info')
            .set({ Authorization: access_token })
            .send({
                groupId: group._id
            });
        expect(response.status).toBe(200);
    });
    test('Group Controller - change role in the same user', async () => {
        const {
            name
        } = privateGroup;
        const group = await groupService.getGroupByName(name);
        const access_token = users[1].token;
        const response = await request(app)
            .post('/api/group/role/add')
            .set({ Authorization: access_token })
            .send({
                groupId: group._id,
                userId: users[1]._id
            });
        expect(response.status).toBe(403);
    });
    test('Group Controller - change role in the another user', async () => {
        const {
            name
        } = privateGroup;
        const group = await groupService.getGroupByName(name);
        const access_token = users[2].token;
        const response = await request(app)
            .post('/api/group/role/add')
            .set({ Authorization: access_token })
            .send({
                groupId: group._id,
                userId: users[1]._id,
                role: ADMIN_ROLE
            });
        expect(response.status).toBe(200);
    });
    test('Group Controller - info in group after get role admin', async () => {
        const {
            name
        } = privateGroup;
        const group = await groupService.getGroupByName(name);
        const access_token = users[1].token;
        const response = await request(app)
            .post('/api/group/info')
            .set({ Authorization: access_token })
            .send({
                groupId: group._id
            });
        expect(response.status).toBe(200);
    });
});
