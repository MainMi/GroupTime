const request = require('supertest');
const generateData = require('../../helper/generateData');

const app = require('../../../app');
const { ADMIN_ROLE } = require('../../../constant/user.role.enum');

describe('Create User - /api/users/create', () => {
    test('Creating User', async () => {
        const data = generateData.createUser();
        const {
            nickname, firstName, lastName,
            birthday, email, password,
        } = data;
        const response = await request(app)
            .post('/api/users/create')
            .send({
                nickname,
                firstName,
                lastName,
                birthday,
                email,
                password
            });

        expect(response.status).toBe(200);
    });

    test('Creating fail User - not all requered', async () => {
        const data = generateData.createUser();
        const {
            firstName, lastName,
            birthday, email, password
        } = data;

        const response = await request(app)
            .post('/api/users/create')
            .send({
                firstName,
                lastName,
                birthday,
                email,
                password
            });

        expect(response.status).toBe(404);
        expect(response.body.errorStatus).toBe(4043);
    });
    test('Creating fail User - add role admin', async () => {
        const data = generateData.createUser({ role: ADMIN_ROLE });
        const {
            nickname, firstName, lastName,
            birthday, email, password,
            role
        } = data;

        const response = await request(app)
            .post('/api/users/create')
            .send({
                nickname,
                firstName,
                lastName,
                birthday,
                email,
                password,
                role
            });
        expect(response.status).toBe(404);
        expect(response.body.errorStatus).toBe(4043);
    });
    test('Creating fail User - add authorized true', async () => {
        const data = generateData.createUser({ authorized: true });
        const {
            nickname, firstName, lastName,
            birthday, email, password,
            authorized
        } = data;

        const response = await request(app)
            .post('/api/users/create')
            .send({
                nickname,
                firstName,
                lastName,
                birthday,
                email,
                password,
                authorized
            });
        expect(response.status).toBe(404);
        expect(response.body.errorStatus).toBe(4043);
    });
});
