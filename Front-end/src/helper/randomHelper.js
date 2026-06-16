export function generateRandomNumber(a, b) {
    return Math.floor(Math.random() * (b - a + 1)) + a;
}

// Time-ordered, collision-resistant id with a short random suffix. Good enough
// for client-only keys (toasts, list items) where a full UUID is overkill.
export function generateUniqueId(prefix = '') {
    return `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}