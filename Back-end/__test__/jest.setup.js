const { connectDB, disconnectDB } = require('./mongo.config');

beforeAll(async () => {
    await connectDB();
});

afterAll(async () => {
    await disconnectDB();
});
