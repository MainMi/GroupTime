export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Google Identity Services client id. Empty means Google sign-in stays hidden,
// so the app still builds and runs without a Google project configured.
export const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';