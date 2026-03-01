import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

export type NavMode = 'friends' | 'servers';

interface NavState {
    navMode: NavMode;
    selectedServerId: string | null;
    selectedFriendId: string | null;
    selectedChannelId: string | null;
    targetMessageId: string | null;
    lastOpenedChannelByServer: Record<string, string>;
    lastSelectedFriendId: string | null;
    mobileHomeTab: 'friends' | 'requests';
    showMobileMemberList: boolean;
}

const initialState: NavState = {
    navMode: 'friends', // Default to friends
    selectedServerId: null,
    selectedFriendId: null,
    selectedChannelId: null,
    targetMessageId: null,
    lastOpenedChannelByServer: {},
    lastSelectedFriendId: null,
    mobileHomeTab: 'friends',
    showMobileMemberList: false,
};

const navSlice = createSlice({
    name: 'nav',
    initialState,
    reducers: {
        setNavMode: (state, action: PayloadAction<NavMode>) => {
            state.navMode = action.payload;
            state.mobileHomeTab = 'friends';
            state.showMobileMemberList = false;
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
            state.showMobileMemberList = false;

            if (state.selectedServerId && action.payload) {
                state.lastOpenedChannelByServer[state.selectedServerId] =
                    action.payload;
            }
        },
        setTargetMessageId: (state, action: PayloadAction<string | null>) => {
            state.targetMessageId = action.payload;
        },
        toggleMobileHomeTab: (state) => {
            state.mobileHomeTab =
                state.mobileHomeTab === 'friends' ? 'requests' : 'friends';
        },
        toggleMobileMemberList: (state) => {
            state.showMobileMemberList = !state.showMobileMemberList;
        },
    },
});

export const {
    setNavMode,
    setSelectedServerId,
    setSelectedFriendId,
    setSelectedChannelId,
    setTargetMessageId,
    toggleMobileHomeTab,
    toggleMobileMemberList,
} = navSlice.actions;
export const navReducer = navSlice.reducer;
