import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type NavMode = 'friends' | 'servers';

interface NavState {
    navMode: NavMode;
    selectedServerId: string | null;
    selectedFriendId: string | null;
    selectedChannelId: string | null;
    lastOpenedChannelByServer: Record<string, string>;
    lastSelectedFriendId: string | null;
}

const initialState: NavState = {
    navMode: 'friends', // Default to friends
    selectedServerId: null,
    selectedFriendId: null,
    selectedChannelId: null,
    lastOpenedChannelByServer: {},
    lastSelectedFriendId: null,
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
                state.selectedFriendId = state.lastSelectedFriendId;
            } else {
                state.selectedFriendId = null;
            }
        },
        setSelectedServerId: (state, action: PayloadAction<string>) => {
            state.navMode = 'servers';
            state.selectedServerId = action.payload;
            state.selectedFriendId = null;

            const lastChannel = state.lastOpenedChannelByServer[action.payload];
            state.selectedChannelId = lastChannel || null;
        },
        setSelectedFriendId: (state, action: PayloadAction<string | null>) => {
            state.navMode = 'friends';
            state.selectedFriendId = action.payload;
            state.selectedServerId = null;
            state.selectedChannelId = null;

            if (action.payload) {
                state.lastSelectedFriendId = action.payload;
            }
        },
        setSelectedChannelId: (state, action: PayloadAction<string | null>) => {
            state.navMode = 'servers';
            state.selectedChannelId = action.payload;
            state.selectedFriendId = null;

            if (state.selectedServerId && action.payload) {
                state.lastOpenedChannelByServer[state.selectedServerId] =
                    action.payload;
            }
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
