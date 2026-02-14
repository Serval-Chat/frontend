import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

interface UnreadState {
    unreadServers: Record<string, boolean>;
    unreadDms: Record<string, boolean>;
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
            action: PayloadAction<Record<string, boolean>>,
        ) => {
            state.unreadServers = action.payload;
        },
        setServerUnread: (
            state,
            action: PayloadAction<{ serverId: string; unread: boolean }>,
        ) => {
            state.unreadServers[action.payload.serverId] =
                action.payload.unread;
        },
        setUnreadDms: (
            state,
            action: PayloadAction<Record<string, boolean>>,
        ) => {
            state.unreadDms = action.payload;
        },
        setDmUnread: (
            state,
            action: PayloadAction<{ userId: string; unread: boolean }>,
        ) => {
            state.unreadDms[action.payload.userId] = action.payload.unread;
        },
    },
});

export const { setUnreadServers, setServerUnread, setUnreadDms, setDmUnread } =
    unreadSlice.actions;

export const unreadReducer = unreadSlice.reducer;
