import { createSlice } from '@reduxjs/toolkit';
import { getAccessToken, clearAuthTokens } from '../../helper/authToken';

const initialState = {
    userInfo: {},
    userToken: null,
    groups: []
};

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        updateAuth: (state, action) => {
            Object.assign(state, action.payload);
        },
        updateGroups: (state, action) => {
            const { id } = action.payload;
            const groups = state.groups || [];
            const idx = groups.findIndex(group => group.id === id);

            return {
                ...state,
                groups: idx !== -1
                    ? groups.map((group, index) =>
                        index === idx ? action.payload : group
                    )
                    : [...groups, action.payload],
            };
        },
        removeUserInfo: (state) => {
            // Keep groups so reducers like updateGroups don't hit `undefined`.
            return { ...state, userInfo: {}, userToken: getAccessToken() };
        },
        logOutAuth: () => {
            clearAuthTokens();
            return { ...initialState };
        }
    },
    extraReducers: {},
});


export const authAction = authSlice.actions;

export default authSlice.reducer;
