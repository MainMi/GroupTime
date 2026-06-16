/**
 * Load / stress test using autocannon.
 *
 * Boots the real Express app against an in-memory MongoDB, seeds a user + group
 * + static week + event, then fires concurrent traffic at representative
 * endpoints and prints throughput / latency stats.
 *
 * Run:  npm run test:load
 * Tune: npm run test:load LOAD_CONNECTIONS=50 LOAD_DURATION=10
 */
process.env.NODE_ENV = 'test';

const http = require('http');
const mongoose = require('mongoose');
// eslint-disable-next-line import/no-extraneous-dependencies
const { MongoMemoryServer } = require('mongodb-memory-server');
// eslint-disable-next-line import/no-extraneous-dependencies
const autocannon = require('autocannon');
const request = require('supertest');

const app = require('../app');
const generateData = require('../__test__/helper/generateData');
const { userService, authService } = require('../service');
const { groupService } = require('../service/schedule');
const { ADMIN_ROLE } = require('../constant/user.role.enum');
const { PUBLIC_TYPE } = require('../constant/type/groupTypes.enum');
const { getFormattedDate, getFormattedDateWithTime } = require('../__test__/helper/getFormattedDate');

const CONNECTIONS = Number(process.env.LOAD_CONNECTIONS || 25);
const DURATION = Number(process.env.LOAD_DURATION || 8); // seconds per scenario

const runScenario = (title, opts) => new Promise((resolve, reject) => {
    // eslint-disable-next-line no-console
    console.log(`\n=== Load scenario: ${title} (${CONNECTIONS} connections, ${DURATION}s) ===`);
    const instance = autocannon(
        { connections: CONNECTIONS, duration: DURATION, ...opts },
        (err, result) => {
            if (err) return reject(err);
            const summary = {
                scenario: title,
                requests_total: result.requests.total,
                req_per_sec_avg: result.requests.average,
                latency_avg_ms: result.latency.average,
                latency_p97_5_ms: result.latency.p97_5,
                latency_max_ms: result.latency.max,
                non2xx: result.non2xx,
                errors: result.errors,
                timeouts: result.timeouts,
            };
            // eslint-disable-next-line no-console
            console.log('[LOAD-RESULT]', JSON.stringify(summary, null, 2));
            return resolve(summary);
        }
    );
    autocannon.track(instance, { renderProgressBar: true });
});

(async () => {
    const mongodb = new MongoMemoryServer({});
    let server;
    try {
        await mongodb.ensureInstance();
        await mongoose.set('strictQuery', false).connect(mongodb.getUri());

        // ---- Seed data ---------------------------------------------------
        const admin = generateData.createUser();
        const hashPassword = await authService.hashPassword(admin.password);
        await userService.createUser({
            ...admin,
            password: hashPassword,
            global_role: ADMIN_ROLE,
            authorized: true,
            groups: undefined,
            avatar: undefined,
        });

        const login = await request(app)
            .post('/api/auth/login')
            .send({ email: admin.email, password: admin.password });
        const token = login.body.access_token;

        const group = generateData.createGroup({ type: PUBLIC_TYPE });
        await request(app)
            .post('/api/group/create')
            .set({ Authorization: token })
            .send({ name: group.name, description: group.description, type: group.type });
        const groupInfo = await groupService.getGroupByName(group.name);
        const groupId = String(groupInfo._id);

        await request(app)
            .post('/api/schedule/week/add/static')
            .set({ Authorization: token })
            .send({ groupId });

        const ev = generateData.generateEventInfoData();
        ev.groupId = groupId;
        ev.date = getFormattedDateWithTime(new Date());
        ev.duration = 90;
        await request(app)
            .post('/api/schedule/event/add/static')
            .set({ Authorization: token })
            .send(ev);

        const dateStr = getFormattedDate(new Date());

        // ---- Start the server -------------------------------------------
        server = http.createServer(app);
        await new Promise((res) => server.listen(0, res));
        const { port } = server.address();
        const url = `http://127.0.0.1:${port}`;

        const jsonHeaders = { 'Content-Type': 'application/json', Authorization: token };

        // ---- Scenarios ---------------------------------------------------
        await runScenario('GET /api/auth/userInfo', {
            url,
            requests: [{ method: 'GET', path: '/api/auth/userInfo', headers: { Authorization: token } }],
        });

        await runScenario('POST /api/schedule/week/info', {
            url,
            requests: [{
                method: 'POST',
                path: '/api/schedule/week/info',
                headers: jsonHeaders,
                body: JSON.stringify({ groupId, date: dateStr }),
            }],
        });

        await runScenario('POST /api/schedule/week/static/list', {
            url,
            requests: [{
                method: 'POST',
                path: '/api/schedule/week/static/list',
                headers: jsonHeaders,
                body: JSON.stringify({ groupId }),
            }],
        });

        // eslint-disable-next-line no-console
        console.log('\nLoad test complete.');
    } catch (e) {
        // eslint-disable-next-line no-console
        console.error('Load test failed:', e);
        process.exitCode = 1;
    } finally {
        if (server) await new Promise((res) => server.close(res));
        await mongoose.connection.close();
        try { await mongodb.stop(); } catch (e) { /* ignore teardown kill errors */ }
    }
})();
