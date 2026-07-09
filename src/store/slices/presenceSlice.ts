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
                {
                    userId: string;
                    username: string;
                    status?: { text: string; emoji?: string | null } | null;
                }[]
            >,
        ): void => {
            const incomingIds = new Set(action.payload.map((u) => u.userId));

            for (const uid of Object.keys(state.users)) {
                const user = state.users[uid];
                if (user && !incomingIds.has(uid) && user.status === 'online') {
                    user.status = 'offline';

                    user.customStatus = null;
                }
            }

            // Add/update everyone the server says is online.
            for (const user of action.payload) {
                state.users[user.userId] = {
                    userId: user.userId,
                    username: user.username,
                    status: 'online',
                    customStatus: user.status ?? null,
                };
            }
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
                customStatus: action.payload.status ?? null,
            };
        },
        setUserOffline: (
            state,
            action: PayloadAction<{ userId: string; username: string }>,
        ): void => {
            const existing = state.users[action.payload.userId];
            if (existing) {
                existing.status = 'offline';

                existing.customStatus = null;
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
            const existing = state.users[action.payload.userId];
            if (existing) {
                existing.customStatus = action.payload.status;
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
            for (const user of Object.values(state.users)) {
                if (user.username === action.payload.username) {
                    user.customStatus = action.payload.customStatus;
                }
            }
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
