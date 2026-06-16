import { combineReducers, configureStore } from "@reduxjs/toolkit";
import {
  persistStore,
  persistReducer,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import storage from "redux-persist/lib/storage";

import authReducer from "./slices/auth-slice";
import scheduleReducer from "./slices/schedule-slice";
import groupsInfoReducer from "./slices/group-info-slice";
import messagesReducer from "./slices/message-slice";
import eventReducer from "./slices/event-slice";
import notificationReducer from "./slices/notification-slice";
import { registerNotifyDispatch } from "../helper/notify";

const rootReducer = combineReducers({
  auth: authReducer,
  schedule: scheduleReducer,
  group: groupsInfoReducer,
  messages: messagesReducer,
  event: eventReducer,
  notification: notificationReducer,
});

// Persist only the cacheable, non-sensitive slices: the schedule week cache (so
// reloads don't re-fetch everything — see schedule-slice version checks), the
// group detail cache (so opening a group doesn't refetch every time), and the AI
// chat history. Auth/tokens are handled separately and intentionally NOT persisted.
const persistConfig = {
  key: "gt_root",
  version: 1,
  storage,
  whitelist: ["schedule", "messages", "group"],
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
