import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type NavMode = 'friends' | 'servers';

interface NavState {
    navMode: NavMode;
    selectedServerId: string | null;
    selectedFriendId: string | null;
    selectedChannelId: string | null;
}

const initialState: NavState = {
    navMode: 'friends', // Default to friends
    selectedServerId: null,
    selectedFriendId: null,
    selectedChannelId: null,
};

const navSlice = createSlice({
    name: 'nav',
    initialState,
    reducers: {
        setNavMode: (state, action: PayloadAction<NavMode>) => {
            state.navMode = action.payload;
            if (action.payload === 'friends') {
                state.selectedServerId = null;
                state.selectedChannelId = null;
            } else {
                state.selectedFriendId = null;
            }
        },
        setSelectedServerId: (state, action: PayloadAction<string>) => {
            state.navMode = 'servers';
            state.selectedServerId = action.payload;
            state.selectedFriendId = null;
        },
        setSelectedFriendId: (state, action: PayloadAction<string | null>) => {
            state.navMode = 'friends';
            state.selectedFriendId = action.payload;
            state.selectedServerId = null;
            state.selectedChannelId = null;
        },
        setSelectedChannelId: (state, action: PayloadAction<string | null>) => {
            state.navMode = 'servers';
            state.selectedChannelId = action.payload;
            state.selectedFriendId = null;
        },
    },
});

export const {
    setNavMode,
    setSelectedServerId,
    setSelectedFriendId,
    setSelectedChannelId,
} = navSlice.actions;
export default navSlice.reducer;
