/**
 * Backfill createdAt/updatedAt on existing ScheduleWeek documents.
 *
 * The ScheduleWeek schema gained `{ timestamps: true }` so that `updatedAt` can
 * serve as a lightweight cache version (see scheduleWeek.controller.getScheduleVersion).
 * Documents created before that change have no timestamps; this script sets them
 * so the first version check returns a stable value instead of 0/undefined.
 *
 * Usage:
 *   node scripts/migrate-scheduleweek-timestamps.js
 * (requires MONGODB_URL in the environment / .env)
 */

require('dotenv').config();
const mongoose = require('mongoose');

const { MONGODB_URL } = require('../config/config');

async function run() {
    if (!MONGODB_URL) {
        console.error('MONGODB_URL is not set. Aborting.');
        process.exit(1);
    }

    await mongoose.connect(MONGODB_URL);
    console.log('Connected to MongoDB.');

    // Operate on the raw collection so we don't depend on schema strictness and
    // can match docs missing the timestamp fields.
    const collection = mongoose.connection.collection('scheduleweeks');
    const now = new Date();

    const missingUpdated = await collection.countDocuments({ updatedAt: { $exists: false } });
    const missingCreated = await collection.countDocuments({ createdAt: { $exists: false } });
    console.log(`Docs missing updatedAt: ${missingUpdated}, missing createdAt: ${missingCreated}`);

    const resUpdated = await collection.updateMany(
        { updatedAt: { $exists: false } },
        { $set: { updatedAt: now } }
    );
    const resCreated = await collection.updateMany(
        { createdAt: { $exists: false } },
        { $set: { createdAt: now } }
    );

    console.log(`Backfilled updatedAt on ${resUpdated.modifiedCount} docs.`);
    console.log(`Backfilled createdAt on ${resCreated.modifiedCount} docs.`);

    await mongoose.disconnect();
    console.log('Done.');
}

run().catch((e) => {
    console.error('Migration failed:', e);
    process.exit(1);
});
