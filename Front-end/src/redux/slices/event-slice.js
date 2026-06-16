import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  currentEvent: null,
  events: [],
  isLoading: false,
  error: null,
  selectedDate: null,
  selectedGroupId: null,
};

const eventSlice = createSlice({
  name: 'event',
  initialState,
  reducers: {
    setCurrentEvent: (state, action) => {
      state.currentEvent = action.payload;
    },
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
    addEvent: (state, action) => {
      state.events.push(action.payload);
    },
    updateEvent: (state, action) => {
      const { eventId, updates } = action.payload;
      const index = state.events.findIndex((e) => e.eventInfoId === eventId);
      if (index !== -1) {
        state.events[index] = { ...state.events[index], ...updates };
      }
    },
    removeEvent: (state, action) => {
      const { eventId } = action.payload;
      state.events = state.events.filter((e) => e.eventInfoId !== eventId);
    },
    setEvents: (state, action) => {
      state.events = action.payload;
    },
    clearEvents: (state) => {
      state.events = [];
    },
    setLoading: (state, action) => {
      state.isLoading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSelectedDate: (state, action) => {
      state.selectedDate = action.payload instanceof Date ? action.payload.toISOString() : action.payload;
    },
    setSelectedGroupId: (state, action) => {
      state.selectedGroupId = action.payload;
    },
  },
});

export const eventActions = eventSlice.actions;
export default eventSlice.reducer;
