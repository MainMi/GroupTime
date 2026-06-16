// eslint-disable-next-line import/no-extraneous-dependencies
const { MongoMemoryServer } = require('mongodb-memory-server');
const mongoose = require('mongoose');

const mongodb = new MongoMemoryServer({});

module.exports = {
    connectDB: async () => {
        await mongodb.ensureInstance();
        const testUri = mongodb.getUri();

        await mongoose
            .set('debug', false)
            .set('strictQuery', false)
            .connect(testUri);
    },
    disconnectDB: async () => {
        await mongoose.connection.dropDatabase();
        await mongoose.connection.close();

        // On Windows, stopping the in-memory mongod can throw `kill EPERM`
        // during teardown (the process is still releasing file handles). That
        // teardown error would mark an otherwise-passing suite as failed, so we
        // swallow it — the Jest process exits right after anyway.
        try {
            await mongodb.stop();
        } catch (e) {
            // ignore teardown kill errors
        }
    },
    clearDB: async () => {
        const { collections } = mongoose.connection;
        for (const key in collections) {
            const collection = collections[key];

            // eslint-disable-next-line no-await-in-loop
            await collection.deleteMany({});
        }
    }
};
