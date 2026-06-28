const request = require('supertest');
const generateData = require('../helper/generateData');

const app = require('../../app');
const { userService, authService } = require('../../service');
const { ADMIN_ROLE } = require('../../constant/user.role.enum');
const { PUBLIC_TYPE } = require('../../constant/type/groupTypes.enum');
const { groupService } = require('../../service/schedule');
const { getFormattedDate, getFormattedDateWithTime } = require('../helper/getFormattedDate');

const ITERATIONS = 30;
const MAX_AVG_MS = 750;

const measure = async (label, fn) => {
    await fn();

    const samples = [];
    for (let i = 0; i < ITERATIONS; i += 1) {
        const start = process.hrtime.bigint();
        // eslint-disable-next-line no-await-in-loop
        await fn();
        const end = process.hrtime.bigint();
        samples.push(Number(end - start) / 1e6); // ns -> ms
    }

    samples.sort((a, b) => a - b);
    const sum = samples.reduce((acc, v) => acc + v, 0);
    const avg = sum / samples.length;
    const p95 = samples[Math.floor(samples.length * 0.95)];
    const stats = {
        endpoint: label,
        avgMs: Number(avg.toFixed(2)),
        minMs: Number(samples[0].toFixed(2)),
        maxMs: Number(samples[samples.length - 1].toFixed(2)),
        p95Ms: Number(p95.toFixed(2)),
        iterations: ITERATIONS,
    };
    // eslint-disable-next-line no-console
    console.log('[API-SPEED]', JSON.stringify(stats));
    return stats;
};

describe('API response-time benchmark', () => {
    const admin = generateData.createUser();
    const group = generateData.createGroup({ type: PUBLIC_TYPE });
    const today = new Date();
    const dateStr = getFormattedDate(today);

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

        await request(app)
            .post('/api/schedule/week/add/static')
            .set({ Authorization: admin.token })
            .send({ groupId: group._id });

        const ev = generateData.generateEventInfoData();
        ev.groupId = group._id;
        ev.date = getFormattedDateWithTime(today);
        ev.duration = 90;
        await request(app)
            .post('/api/schedule/event/add/static')
            .set({ Authorization: admin.token })
            .send(ev);
    });

    test('POST /auth/login latency', async () => {
        const stats = await measure('POST /api/auth/login', () => request(app)
            .post('/api/auth/login')
            .send({ email: admin.email, password: admin.password })
            .expect(200));
        expect(stats.avgMs).toBeLessThan(MAX_AVG_MS * 2); // bcrypt compare is intentionally slow
    });

    test('POST /auth/userInfo latency', async () => {
        const stats = await measure('POST /api/auth/userInfo', () => request(app)
            .post('/api/auth/userInfo')
            .set({ Authorization: admin.token })
            .expect(200));
        expect(stats.avgMs).toBeLessThan(MAX_AVG_MS);
    });

    test('POST /schedule/week/info latency', async () => {
        const stats = await measure('POST /api/schedule/week/info', () => request(app)
            .post('/api/schedule/week/info')
            .set({ Authorization: admin.token })
            .send({ groupId: group._id, date: dateStr })
            .expect(200));
        expect(stats.avgMs).toBeLessThan(MAX_AVG_MS);
    });

    test('POST /schedule/week/static/list latency', async () => {
        const stats = await measure('POST /api/schedule/week/static/list', () => request(app)
            .post('/api/schedule/week/static/list')
            .set({ Authorization: admin.token })
            .send({ groupId: group._id })
            .expect(200));
        expect(stats.avgMs).toBeLessThan(MAX_AVG_MS);
    });
});
