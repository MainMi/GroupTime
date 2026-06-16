/**
 * One-off membership repair + owner backfill.
 *
 * Fixes data that drifted before the integrity rules / owner role existed:
 *   1. Deletes orphaned Verificate docs (group or user no longer exists).
 *   2. De-duplicates memberships for the same (user, group) pair.
 *   3. Rebuilds every user.groups / group.users array from the surviving
 *      Verificate ids, so no array points at a missing membership ("valid ids").
 *   4. Recomputes user.groupCount / group.userCount from surviving VERIFIED
 *      memberships whose group still exists.
 *   5. Backfills an owner: any group without a VERIFIED `owner` gets its oldest
 *      VERIFIED admin promoted (or, failing that, its oldest VERIFIED member).
 *
 * The visible group count is now derived on the client from the populated
 * `groups` array (helper/groupHelper.js); this script keeps the stored counters
 * and arrays consistent for the backend checks.
 *
 * Run:  node scripts/fixMemberships.js
 *       node scripts/fixMemberships.js --dry   (report only, no writes)
 */
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const { MONGODB_URL } = require('../config/config');
const { VERIFIED_TYPE } = require('../constant/type/verificateToken.enum');
const { OWNER_ROLE, ADMIN_ROLE } = require('../constant/user.role.enum');

const Group = require('../model/group.model');
const User = require('../model/user.model');
const Verificate = require('../model/verificateModel');

const DRY_RUN = process.argv.includes('--dry');
const oldestFirst = (a, b) => new Date(a.createdAt) - new Date(b.createdAt);

const run = async () => {
    if (!MONGODB_URL) throw new Error('MONGODB_URL is not set (check your .env)');
    await mongoose.connect(MONGODB_URL);
    console.log(`Connected to MongoDB${DRY_RUN ? ' (dry run)' : ''}\n`);

    const [
        groups,
        users,
        verificates
    ] = await Promise.all([
        Group.find({}, { _id: 1 }).lean(),
        User.find({}, {
            _id: 1, nickname: 1, groups: 1, groupCount: 1
        }).lean(),
        Verificate.find({}, {
            user: 1, group: 1, role: 1, type: 1, createdAt: 1
        }).lean(),
    ]);

    const groupIds = new Set(groups.map((g) => String(g._id)));
    const userIds = new Set(users.map((u) => String(u._id)));

    // 1 + 2: drop orphans, then dedupe (user, group) keeping the best survivor.
    const toDelete = [];
    const byPair = new Map();
    for (const v of verificates) {
        if (!groupIds.has(String(v.group)) || !userIds.has(String(v.user))) {
            toDelete.push(v);
            continue;
        }
        const key = `${v.user}|${v.group}`;
        const existing = byPair.get(key);
        if (!existing) {
            byPair.set(key, v);
        } else {
            // Prefer VERIFIED, then the oldest, as the keeper.
            const keepNew = (v.type === VERIFIED_TYPE && existing.type !== VERIFIED_TYPE)
                || (v.type === existing.type && oldestFirst(v, existing) < 0);
            const loser = keepNew ? existing : v;
            if (keepNew) byPair.set(key, v);
            toDelete.push(loser);
        }
    }

    const survivors = [...byPair.values()];
    console.log(`Verificates: ${verificates.length} total, ${survivors.length} survive, ${toDelete.length} to delete`);

    // 5: owner backfill — group survivors by group.
    const survivorsByGroup = new Map();
    const survivorsByUser = new Map();
    for (const v of survivors) {
        const g = String(v.group);
        const u = String(v.user);
        if (!survivorsByGroup.has(g)) survivorsByGroup.set(g, []);
        if (!survivorsByUser.has(u)) survivorsByUser.set(u, []);
        survivorsByGroup.get(g).push(v);
        survivorsByUser.get(u).push(v);
    }

    let ownersAdded = 0;
    for (const [
        groupId,
        members
    ] of survivorsByGroup) {
        const verified = members.filter((m) => m.type === VERIFIED_TYPE);
        if (verified.some((m) => m.role === OWNER_ROLE)) continue;

        const admins = verified.filter((m) => m.role === ADMIN_ROLE).sort(oldestFirst);
        const promote = admins[0] || verified.slice().sort(oldestFirst)[0];
        if (!promote) continue;

        console.log(`Group ${groupId}: promote ${promote.user} -> owner`);
        promote.role = OWNER_ROLE; // keep in-memory copy consistent
        ownersAdded += 1;
        if (!DRY_RUN) {
            await Verificate.updateOne({ _id: promote._id }, { $set: { role: OWNER_ROLE } });
        }
    }

    // 1 (apply): delete orphan + duplicate Verificate docs.
    if (!DRY_RUN && toDelete.length) {
        await Verificate.deleteMany({ _id: { $in: toDelete.map((v) => v._id) } });
    }

    // 3 + 4: rebuild arrays + counters for groups.
    let groupsFixed = 0;
    for (const group of groups) {
        const members = survivorsByGroup.get(String(group._id)) || [];
        const userCount = members.filter((m) => m.type === VERIFIED_TYPE).length;
        groupsFixed += 1;
        if (!DRY_RUN) {
            await Group.updateOne(
                { _id: group._id },
                { $set: { users: members.map((m) => m._id), userCount } }
            );
        }
    }

    // 3 + 4: rebuild arrays + counters for users.
    let usersFixed = 0;
    for (const user of users) {
        const memberships = survivorsByUser.get(String(user._id)) || [];
        const groupCount = memberships.filter((m) => m.type === VERIFIED_TYPE).length;
        const before = user.groupCount;
        if (before !== groupCount || (user.groups || []).length !== memberships.length) {
            console.log(`User ${user.nickname || user._id}: groupCount ${before} -> ${groupCount}, groups ${(user.groups || []).length} -> ${memberships.length}`);
            usersFixed += 1;
        }
        if (!DRY_RUN) {
            await User.updateOne(
                { _id: user._id },
                { $set: { groups: memberships.map((m) => m._id), groupCount } }
            );
        }
    }

    console.log(`\nDone${DRY_RUN ? ' (dry run — no writes)' : ''}.`);
    console.log(`  ${toDelete.length} stale membership(s) removed`);
    console.log(`  ${ownersAdded} owner(s) backfilled`);
    console.log(`  ${groupsFixed} group(s) and ${usersFixed} user(s) updated`);

    await mongoose.disconnect();
};

run()
    .then(() => process.exit(0))
    .catch((err) => {
        console.error('Fix failed:', err);
        process.exit(1);
    });
