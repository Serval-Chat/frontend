import { type PayloadAction, createSlice } from '@reduxjs/toolkit';

export type UserPresenceStatus = 'online' | 'offline';

interface UserPresence {
    userId: string;
    username?: string;
    status: UserPresenceStatus;
    customStatus?: {
        text: string;
        emoji?: string | null;
    } | null;
}

interface PresenceState {
    users: Record<string, UserPresence>;
    backendInstanceId: string | null;
}

const initialState: PresenceState = {
    users: {},
    backendInstanceId: null,
};

const presenceSlice = createSlice({
    name: 'presence',
    initialState,
    reducers: {
        setBackendInstanceId: (state, action: PayloadAction<string>): void => {
            state.backendInstanceId = action.payload;
        },
        setOnlineUsers: (
            state,
            action: PayloadAction<
                Array<{
                    userId: string;
                    username: string;
                    status?: { text: string; emoji?: string | null } | null;
                }>
            >,
        ): void => {
            const incomingIds = new Set(action.payload.map((u) => u.userId));

            for (const uid of Object.keys(state.users)) {
                if (
                    !incomingIds.has(uid) &&
                    state.users[uid].status === 'online'
                ) {
                    state.users[uid].status = 'offline';
                    state.users[uid].customStatus = null;
                }
            }

            // Add/update everyone the server says is online.
            action.payload.forEach((user): void => {
                state.users[user.userId] = {
                    userId: user.userId,
                    username: user.username,
                    status: 'online',
                    customStatus: user.status || null,
                };
            });
        },
        setUserOnline: (
            state,
            action: PayloadAction<{
                userId: string;
                username: string;
                status?: { text: string; emoji?: string | null } | null;
            }>,
        ): void => {
            state.users[action.payload.userId] = {
                userId: action.payload.userId,
                username: action.payload.username,
                status: 'online',
                customStatus: action.payload.status || null,
            };
        },
        setUserOffline: (
            state,
            action: PayloadAction<{ userId: string; username: string }>,
        ): void => {
            if (state.users[action.payload.userId]) {
                state.users[action.payload.userId].status = 'offline';
                state.users[action.payload.userId].customStatus = null;
            } else {
                state.users[action.payload.userId] = {
                    userId: action.payload.userId,
                    username: action.payload.username,
                    status: 'offline',
                    customStatus: null,
                };
            }
        },
        updateUserStatus: (
            state,
            action: PayloadAction<{
                userId: string;
                username: string;
                status: { text: string; emoji?: string | null } | null;
            }>,
        ): void => {
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
                customStatus: { text: string; emoji?: string | null } | null;
            }>,
        ): void => {
            // Find users by username and update their custom status
            Object.values(state.users).forEach((user): void => {
                if (user.username === action.payload.username) {
                    state.users[user.userId].customStatus =
                        action.payload.customStatus;
                }
            });
        },
    },
});

export const {
    setBackendInstanceId,
    setOnlineUsers,
    setUserOnline,
    setUserOffline,
    updateUserStatus,
    updateUserStatusByUsername,
} = presenceSlice.actions;
export const presenceReducer = presenceSlice.reducer;
