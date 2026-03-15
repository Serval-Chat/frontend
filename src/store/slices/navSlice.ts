import { createSlice } from '@reduxjs/toolkit';
import type { PayloadAction } from '@reduxjs/toolkit';

const LAST_CHANNELS_KEY = 'serchat-last-channels';

const loadLastChannels = (): Record<string, string> => {
    try {
        const raw = localStorage.getItem(LAST_CHANNELS_KEY);
        if (raw) return JSON.parse(raw) as Record<string, string>;
    } catch {
        console.error('Failed to load last channels (how!?)');
    }
    return {};
};

export const saveLastChannels = (data: Record<string, string>): void => {
    try {
        localStorage.setItem(LAST_CHANNELS_KEY, JSON.stringify(data));
    } catch {
        console.error('Failed to save last channels (how!?)');
    }
};

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
    openedFolders: string[];
}

const initialState: NavState = {
    navMode: 'friends', // Default to friends
    selectedServerId: null,
    selectedFriendId: null,
    selectedChannelId: null,
    targetMessageId: null,
    lastOpenedChannelByServer: loadLastChannels(),
    lastSelectedFriendId: null,
    mobileHomeTab: 'friends',
    showMobileMemberList: false,
    openedFolders: [],
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
        toggleFolder: (state, action: PayloadAction<string>) => {
            const index = state.openedFolders.indexOf(action.payload);
            if (index !== -1) {
                state.openedFolders.splice(index, 1);
            } else {
                state.openedFolders.push(action.payload);
            }
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
    toggleFolder,
} = navSlice.actions;
export const navReducer = navSlice.reducer;
