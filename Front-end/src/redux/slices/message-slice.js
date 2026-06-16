import { createSlice } from '@reduxjs/toolkit';

const initialState = {
    history: [],
    status: 'idle',
    error: null,
};

// Persistence is handled by redux-persist (see redux/store.js — the `messages`
// slice is whitelisted), so these reducers just update in-memory state.
const messageSlice = createSlice({
    name: 'messages',
    initialState,
    reducers: {
        updateMessages: (state, action) => {
            state.history = action.payload;
        },
        addMessage: (state, action) => {
            state.history.push(action.payload);
        },
        clearMessages: (state) => {
            state.history = [];
        },
    }
});

export const messagesAction = messageSlice.actions;

export default messageSlice.reducer;
