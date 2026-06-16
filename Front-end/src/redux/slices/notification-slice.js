import { createSlice } from '@reduxjs/toolkit';
import { generateUniqueId } from '../../helper/randomHelper';

const initialState = {
  notifications: [],
};

// Show at most this many toasts at once (e.g. an error + a success together).
const MAX_TOASTS = 2;

const notificationSlice = createSlice({
  name: 'notification',
  initialState,
  reducers: {
    addNotification: (state, action) => {
      // Date.now() alone can collide when an error and a success fire in the same
      // tick; the random suffix keeps each toast's id unique and removable.
      const id = generateUniqueId();
      state.notifications.push({
        id,
        ...action.payload,
      });
      // Keep only the most recent toasts so the screen isn't flooded.
      if (state.notifications.length > MAX_TOASTS) {
        state.notifications = state.notifications.slice(-MAX_TOASTS);
      }
    },
    removeNotification: (state, action) => {
      state.notifications = state.notifications.filter(
        (notif) => notif.id !== action.payload
      );
    },
    clearNotifications: (state) => {
      state.notifications = [];
    },
  },
});

export const notificationActions = notificationSlice.actions;
export default notificationSlice.reducer;
