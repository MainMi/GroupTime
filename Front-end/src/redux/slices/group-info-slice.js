import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    groupsInfo: [],
};

const groupInfoSlice = createSlice({
    name: 'groups',
    initialState,
    reducers: {
        setGroupsInfo: (state, action) => ({ ...state, ...action.payload }),
        addGroupInfo: (state, action) => {
            const { id } = action.payload;
            if (!state.groupsInfo) state.groupsInfo = [];

            // Stamp the fetch time so GroupInfo can serve the persisted copy and
            // only revalidate past a TTL instead of refetching on every visit.
            const entry = { ...action.payload, fetchedAt: Date.now() };
            const idx = state.groupsInfo.findIndex(group => group.id === id);

            if (idx !== -1) {
                state.groupsInfo[idx] = entry;
                return;
            }
            state.groupsInfo.push(entry);
        }
    },
    extraReducers: {},
});


export const groupInfoAction = groupInfoSlice.actions;

export default groupInfoSlice.reducer;
