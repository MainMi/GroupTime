import { createSlice } from '@reduxjs/toolkit';
import { getISOWeekNumber } from '../../helper/dateHelper';

const initialState = {
    schedules: [],
    // Static weeks list cached per group ({ [groupId]: [{_id, countWeek}, ...] }),
    // so opening schedule settings doesn't refetch every time.
    staticWeeks: {},
};

const scheduleSlice = createSlice({
    name: 'schedule',
    initialState,
    reducers: {
        addSchedule: (state, action) => {
            const { data, date, groupId, staticWeeksCount, version } = action.payload;
            const isoWeek = getISOWeekNumber(date);
            const existingIdx = state.schedules.findIndex(
                item => item.isoWeek === isoWeek && item.groupId === groupId
            );
            // `version` (server updatedAt) lets refreshSchedule skip a full refetch
            // when the lightweight /week/version check matches the cached copy.
            const entry = { data, isoWeek, groupId, staticWeeksCount, version, fetchedAt: Date.now() };
            if (existingIdx !== -1) {
                state.schedules[existingIdx] = entry;
            } else {
                state.schedules.push(entry);
            }
        },
        // Mark a cached week as freshly validated (version matched) without
        // replacing its data, so we don't re-check it again within the TTL window.
        touchSchedule: (state, action) => {
            const { isoWeek, groupId } = action.payload;
            const entry = state.schedules.find(
                item => item.isoWeek === isoWeek && item.groupId === groupId
            );
            if (entry) entry.fetchedAt = Date.now();
        },
        clearScheduleWeek: (state, action) => {
            const { isoWeek, groupId } = action.payload;
            state.schedules = state.schedules.filter(
                item => !(item.isoWeek === isoWeek && item.groupId === groupId)
            );
        },
        // Drop every cached week for a group. Static changes (event create/edit/
        // delete, week reorder/delete) affect many ISO weeks at once, so refreshing
        // only the current week leaves the others stale. Pass no groupId to clear all
        // (e.g. "all groups" mode).
        clearGroupSchedules: (state, action) => {
            const groupId = action.payload != null ? String(action.payload) : null;
            if (!groupId) {
                state.schedules = [];
                return;
            }
            state.schedules = state.schedules.filter(
                item => String(item.groupId) !== groupId
            );
        },
        setStaticWeeks: (state, action) => {
            const { groupId, list } = action.payload;
            state.staticWeeks[String(groupId)] = list;
        },
        clearStaticWeeks: (state, action) => {
            const groupId = action.payload != null ? String(action.payload) : null;
            if (!groupId) {
                state.staticWeeks = {};
                return;
            }
            delete state.staticWeeks[groupId];
        },
    },
});

export const schedulehAction = scheduleSlice.actions;
export default scheduleSlice.reducer;
