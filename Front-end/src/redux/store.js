import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  createMigrate,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import authReducer, { authAction } from "./slices/auth-slice";
import scheduleReducer from "./slices/schedule-slice";
import groupsInfoReducer from "./slices/group-info-slice";
import messagesReducer from "./slices/message-slice";
import eventReducer from "./slices/event-slice";
import notificationReducer from "./slices/notification-slice";
import { registerNotifyDispatch } from "../helper/notify";

const appReducer = combineReducers({
  auth: authReducer,
  schedule: scheduleReducer,
  group: groupsInfoReducer,
  messages: messagesReducer,
  event: eventReducer,
  notification: notificationReducer,
});

// Wipe the per-user AI chat history on logout so a different account signing in
// on the same device never inherits the previous user's in-memory conversation.
// Setting the slice to `undefined` makes its reducer fall back to initialState.
const rootReducer = (state, action) => {
  if (action.type === authAction.logOutAuth.type) {
    return appReducer({ ...state, messages: undefined }, action);
  }
  return appReducer(state, action);
};

// Persist only the cacheable, non-sensitive slices: the schedule week cache (so
// reloads don't re-fetch everything — see schedule-slice version checks) and the
// group detail cache (so opening a group doesn't refetch every time).
// The AI chat history is intentionally NOT persisted: it is always re-fetched
// per-user from the backend (GET /message/getLast is scoped to the authed user),
// and persisting it to localStorage leaked one account's bot history to the next
// account signing in on the same device. Auth/tokens are also never persisted.
// v2 drops the previously-persisted `messages` slice so any bot history already
// saved on the device (from before it was removed from the whitelist) is purged
// on upgrade rather than rehydrated one last time.
const migrations = {
  2: (state) => {
    if (!state) return state;
    const { messages, ...rest } = state;
    return rest;
  },
};

const persistConfig = {
  key: "gt_root",
  version: 2,
  storage,
  whitelist: ["schedule", "group"],
  migrate: createMigrate(migrations),
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // redux-persist dispatches these non-serializable internal actions.
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export const persistor = persistStore(store);

// Let the api layer raise toasts without access to a component dispatch.
registerNotifyDispatch(store.dispatch);

export default store;
