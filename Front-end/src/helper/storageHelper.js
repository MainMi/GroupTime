// Safe JSON-backed localStorage helpers — swallow parse/quota errors and fall
// back to a default so a corrupt entry can never crash the app.
export const getStorageJSON = (key, defaultValue = null) => {
    try {
        const raw = localStorage.getItem(key);
        return raw ? JSON.parse(raw) : defaultValue;
    } catch (e) {
        console.error(`Failed to read storage key "${key}":`, e);
        return defaultValue;
    }
};

export const setStorageJSON = (key, value) => {
    try {
        localStorage.setItem(key, JSON.stringify(value));
    } catch (e) {
        console.error(`Failed to save storage key "${key}":`, e);
    }
};

export const removeStorage = (key) => {
    try {
        localStorage.removeItem(key);
    } catch (e) {
        console.error(`Failed to remove storage key "${key}":`, e);
    }
};
