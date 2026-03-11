import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

interface UnreadServerStatus {
    hasUnread: boolean;
    pingCount: number;
}

interface UnreadState {
    unreadServers: Record<string, UnreadServerStatus>;
    unreadDms: Record<string, number>;
}

const initialState: UnreadState = {
    unreadServers: {},
    unreadDms: {},
};

export const unreadSlice = createSlice({
    name: 'unread',
    initialState,
    reducers: {
        setUnreadServers: (
            state,
            action: PayloadAction<Record<string, UnreadServerStatus>>,
        ) => {
            state.unreadServers = action.payload;
        },
        setServerUnread: (
            state,
            action: PayloadAction<{ serverId: string; unread: boolean }>,
        ) => {
            if (!state.unreadServers[action.payload.serverId]) {
                state.unreadServers[action.payload.serverId] = {
                    hasUnread: action.payload.unread,
                    pingCount: 0,
                };
            } else {
                state.unreadServers[action.payload.serverId].hasUnread =
                    action.payload.unread;
            }
        },
        setServerPingCount: (
            state,
            action: PayloadAction<{ serverId: string; count: number }>,
        ) => {
            if (!state.unreadServers[action.payload.serverId]) {
                state.unreadServers[action.payload.serverId] = {
                    hasUnread: false,
                    pingCount: action.payload.count,
                };
            } else {
                state.unreadServers[action.payload.serverId].pingCount =
                    action.payload.count;
            }
        },
        incrementServerPing: (
            state,
            action: PayloadAction<{ serverId: string }>,
        ) => {
            if (!state.unreadServers[action.payload.serverId]) {
                state.unreadServers[action.payload.serverId] = {
                    hasUnread: false,
                    pingCount: 1,
                };
            } else {
                state.unreadServers[action.payload.serverId].pingCount += 1;
            }
        },
        decrementServerPing: (
            state,
            action: PayloadAction<{ serverId: string }>,
        ) => {
            const status = state.unreadServers[action.payload.serverId];
            if (status && status.pingCount > 0) {
                status.pingCount -= 1;
            }
        },
        setUnreadDms: (
            state,
            action: PayloadAction<Record<string, number>>,
        ) => {
            state.unreadDms = action.payload;
        },
        setDmUnread: (
            state,
            action: PayloadAction<{ userId: string; count: number }>,
        ) => {
            state.unreadDms[action.payload.userId] = action.payload.count;
        },
    },
});

export const {
    setUnreadServers,
    setServerUnread,
    setServerPingCount,
    incrementServerPing,
    decrementServerPing,
    setUnreadDms,
    setDmUnread,
} = unreadSlice.actions;

export const unreadReducer = unreadSlice.reducer;
