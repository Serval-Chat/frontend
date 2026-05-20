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
export type SplitViewSide = 'left' | 'right';

export type SplitViewConversation =
    | { type: 'channel'; serverId: string; channelId: string }
    | { type: 'dm'; friendId: string };

interface NavState {
    navMode: NavMode;
    selectedServerId: string | null;
    selectedFriendId: string | null;
    selectedChannelId: string | null;
    targetMessageId: string | null;
    splitView: Record<SplitViewSide, SplitViewConversation | null>;
    lastOpenedChannelByServer: Record<string, string>;
    lastSelectedFriendId: string | null;
    mobileHomeTab: 'friends' | 'requests';
    showMobileMemberList: boolean;
    openedFolders: string[];
}

const getSelectedConversation = (
    state: NavState,
): SplitViewConversation | null => {
    if (state.selectedFriendId) {
        return { type: 'dm', friendId: state.selectedFriendId };
    }

    if (state.selectedServerId && state.selectedChannelId) {
        return {
            type: 'channel',
            serverId: state.selectedServerId,
            channelId: state.selectedChannelId,
        };
    }

    return null;
};

const conversationsEqual = (
    a: SplitViewConversation | null,
    b: SplitViewConversation | null,
): boolean => {
    if (!a || !b) return a === b;
    if (a.type !== b.type) return false;

    if (a.type === 'dm' && b.type === 'dm') {
        return a.friendId === b.friendId;
    }

    if (a.type === 'channel' && b.type === 'channel') {
        return a.serverId === b.serverId && a.channelId === b.channelId;
    }

    return false;
};

const clearSplitView = (state: NavState): void => {
    state.splitView.left = null;
    state.splitView.right = null;
};

const isSplitViewActive = (state: NavState): boolean =>
    !!(state.splitView.left || state.splitView.right);

const placeConversationInSplitView = (
    state: NavState,
    conversation: SplitViewConversation,
    preferredSide: SplitViewSide,
): void => {
    if (!isSplitViewActive(state)) return;

    if (
        conversationsEqual(state.splitView.left, conversation) ||
        conversationsEqual(state.splitView.right, conversation)
    ) {
        return;
    }

    const otherSide: SplitViewSide =
        preferredSide === 'left' ? 'right' : 'left';

    if (!state.splitView[preferredSide]) {
        state.splitView[preferredSide] = conversation;
        return;
    }

    if (!state.splitView[otherSide]) {
        state.splitView[otherSide] = conversation;
        return;
    }

    state.splitView[preferredSide] = conversation;
};

const initialState: NavState = {
    navMode: 'friends', // Default to friends
    selectedServerId: null,
    selectedFriendId: null,
    selectedChannelId: null,
    targetMessageId: null,
    splitView: {
        left: null,
        right: null,
    },
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
                placeConversationInSplitView(
                    state,
                    { type: 'dm', friendId: action.payload },
                    'right',
                );
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
                placeConversationInSplitView(
                    state,
                    {
                        type: 'channel',
                        serverId: state.selectedServerId,
                        channelId: action.payload,
                    },
                    'left',
                );
            }
        },
        setTargetMessageId: (state, action: PayloadAction<string | null>) => {
            state.targetMessageId = action.payload;
        },
        clearLastOpenedChannelForServer: (
            state,
            action: PayloadAction<string>,
        ) => {
            delete state.lastOpenedChannelByServer[action.payload];
            saveLastChannels(state.lastOpenedChannelByServer);
        },
        setSplitViewPane: (
            state,
            action: PayloadAction<{
                side: SplitViewSide;
                conversation: SplitViewConversation;
            }>,
        ) => {
            const { side, conversation } = action.payload;
            const otherSide: SplitViewSide = side === 'left' ? 'right' : 'left';
            const selectedConversation = getSelectedConversation(state);

            if (
                !state.splitView[otherSide] &&
                selectedConversation &&
                !conversationsEqual(selectedConversation, conversation)
            ) {
                state.splitView[otherSide] = selectedConversation;
            }

            state.splitView[side] = conversation;
            state.targetMessageId = null;
        },
        clearSplitViewPane: (state, action: PayloadAction<SplitViewSide>) => {
            state.splitView[action.payload] = null;
        },
        closeSplitView: (state) => {
            clearSplitView(state);
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
        openFolder: (state, action: PayloadAction<string>) => {
            if (!state.openedFolders.includes(action.payload)) {
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
    clearLastOpenedChannelForServer,
    setSplitViewPane,
    clearSplitViewPane,
    closeSplitView,
    toggleMobileHomeTab,
    toggleMobileMemberList,
    toggleFolder,
    openFolder,
} = navSlice.actions;
export const navReducer = navSlice.reducer;
