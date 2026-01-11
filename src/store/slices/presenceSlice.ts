import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export type UserPresenceStatus = 'online' | 'offline';

interface UserPresence {
    userId: string;
    username?: string;
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
                    username: user.username,
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
                username: action.payload.username,
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
                    username: action.payload.username,
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
        updateUserStatusByUsername: (
            state,
            action: PayloadAction<{
                username: string;
                customStatus: string | undefined;
            }>
        ) => {
            // Find users by username and update their custom status
            Object.values(state.users).forEach((user) => {
                if (user.username === action.payload.username) {
                    state.users[user.userId].customStatus =
                        action.payload.customStatus;
                }
            });
        },
    },
});

export const {
    setOnlineUsers,
    setUserOnline,
    setUserOffline,
    updateUserStatus,
    updateUserStatusByUsername,
} = presenceSlice.actions;
export default presenceSlice.reducer;
