const request = require('supertest');
const generateData = require('../../helper/generateData');

const app = require('../../../app');
const { userService } = require('../../../service');
const actionTokenModel = require('../../../model/actionToken.model');
const { FORGOT_PASSWORD, CONFIRM_EMAIL } = require('../../../constant/type/actionTokenTypes.enum');
const OAuthModel = require('../../../model/OAuth.model');

describe('Authorized User - /api/auth', () => {
    const user = generateData.createUser();
    beforeAll(async () => {
        const {
            nickname, firstName, lastName,
            birthday, email, password,
        } = user;
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

    test('Login User - confirm gmail', async () => {
        const [{ _id: userId }] = await userService.getUsers();
        const { action_token } = await actionTokenModel.findOne(
            { userId, action_type: CONFIRM_EMAIL }
        );
        const response = await request(app)
            .get('/api/auth/confirm/email')
            .set({ Authorization: action_token })
            .send();
        expect(response.status).toBe(200);
    });

    test('Login User', async () => {
        const [{ email }] = await userService.getUsers();
        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email,
                password: user.password
            });
        expect(response.status).toBe(200);
    });
    test('Login User - get userInfo', async () => {
        const { access_token } = await OAuthModel.findOne();
        const response = await request(app)
            .post('/api/auth/userInfo')
            .set({ Authorization: access_token })
            .send();
        expect(response.status).toBe(200);
    });
    test('Login User - refresh token', async () => {
        const { refresh_token } = await OAuthModel.findOne();
        const response = await request(app)
            .post('/api/auth/refresh')
            .set({ Authorization: refresh_token })
            .send();
        expect(response.status).toBe(200);
    });

    test('Login User - forgot password', async () => {
        const [{ email }] = await userService.getUsers();
        const response = await request(app)
            .post('/api/auth/forgot/password')
            .send({
                email,
            });
        expect(response.status).toBe(200);
    });

    test('Login User - change password', async () => {
        const [{ _id: userId }] = await userService.getUsers();
        const { action_token } = await actionTokenModel.findOne(
            { userId, action_type: FORGOT_PASSWORD }
        );
        const newPassword = generateData.generatePassword();
        const response = await request(app)
            .patch('/api/auth/forgot/password')
            .set({ Authorization: action_token })
            .send({
                password: newPassword
            });
        user.password = newPassword;
        expect(response.status).toBe(200);
    });
    test('Login User - with new password', async () => {
        const [{ email }] = await userService.getUsers();

        const response = await request(app)
            .post('/api/auth/login')
            .send({
                email,
                password: user.password
            });
        expect(response.status).toBe(200);
    });
});
