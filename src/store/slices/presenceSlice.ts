import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export type UserPresenceStatus = 'online' | 'offline';

interface UserPresence {
    userId: string;
    status: UserPresenceStatus;
    customStatus?: string;
}

interface PresenceState {
    users: Record<string, UserPresence>;
}

const initialState: PresenceState = {
    users: {},
};

const presenceSlice = createSlice({
    name: 'presence',
    initialState,
    reducers: {
        setOnlineUsers: (
            state,
            action: PayloadAction<
                Array<{ userId: string; username: string; status?: string }>
            >
        ) => {
            state.users = {};
            action.payload.forEach((user) => {
                state.users[user.userId] = {
                    userId: user.userId,
                    status: 'online',
                    customStatus: user.status,
                };
            });
        },
        setUserOnline: (
            state,
            action: PayloadAction<{
                userId: string;
                username: string;
                status?: string;
            }>
        ) => {
            state.users[action.payload.userId] = {
                userId: action.payload.userId,
                status: 'online',
                customStatus: action.payload.status,
            };
        },
        setUserOffline: (
            state,
            action: PayloadAction<{ userId: string; username: string }>
        ) => {
            if (state.users[action.payload.userId]) {
                state.users[action.payload.userId].status = 'offline';
            } else {
                state.users[action.payload.userId] = {
                    userId: action.payload.userId,
                    status: 'offline',
                };
            }
        },
        updateUserStatus: (
            state,
            action: PayloadAction<{
                userId: string;
                username: string;
                status: string;
            }>
        ) => {
            if (state.users[action.payload.userId]) {
                state.users[action.payload.userId].customStatus =
                    action.payload.status;
            } else {
                state.users[action.payload.userId] = {
                    userId: action.payload.userId,
                    status: 'online',
                    customStatus: action.payload.status,
                };
            }
        },
    },
});

export const {
    setOnlineUsers,
    setUserOnline,
    setUserOffline,
    updateUserStatus,
} = presenceSlice.actions;
export default presenceSlice.reducer;
