// Short-TTL in-memory cache for access-token → resolved user. Every request pays
// 2-3 Atlas round-trips (~350-500ms) in checkAccessToken; caching the resolved
// user for a few seconds collapses that for request bursts (page loads, drags).
// TTL is deliberately short so revocation/role changes propagate quickly; logout
// also invalidates the user's entries explicitly.
const TTL_MS = 15000;
const MAX_ENTRIES = 500;

const cache = new Map(); // key: `${token}|${fetchType}` -> { user, userId, expires }

module.exports = {
    get: (token, fetchType) => {
        const entry = cache.get(`${token}|${fetchType}`);
        if (!entry) return null;
        if (Date.now() > entry.expires) {
            cache.delete(`${token}|${fetchType}`);
            return null;
        }
        return entry.user;
    },

    set: (token, fetchType, user) => {
        if (cache.size >= MAX_ENTRIES) {
            // Drop the oldest entry (Map preserves insertion order).
            cache.delete(cache.keys().next().value);
        }
        // Group ids embedded in the cached user (populated fetch types only) —
        // lets a group edit evict exactly its members' entries. Unpopulated
        // entries embed no group data, so they don't need group eviction.
        const groupIds = new Set((user.groups || [])
            .map((membership) => membership?.group?._id || membership?.group)
            .filter(Boolean)
            .map(String));
        cache.set(`${token}|${fetchType}`, {
            user,
            userId: String(user._id),
            groupIds,
            expires: Date.now() + TTL_MS,
        });
    },

    // Remove every cached entry for a user (logout / profile / membership change).
    invalidateUser: (userId) => {
        const id = String(userId);
        for (const [
            key,
            entry
        ] of cache) {
            if (entry.userId === id) cache.delete(key);
        }
    },

    // Remove entries whose cached user embeds the group (group edit / avatar /
    // membership change) — the embedded parameters/users would otherwise be
    // stale for the TTL.
    invalidateGroup: (groupId) => {
        const id = String(groupId);
        for (const [
            key,
            entry
        ] of cache) {
            if (entry.groupIds.has(id)) cache.delete(key);
        }
    },
};
