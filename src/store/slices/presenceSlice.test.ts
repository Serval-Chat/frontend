import { describe, expect, it } from 'vitest';

import {
    presenceReducer,
    setOnlineUsers,
    setUserOffline,
    setUserOnline,
    updateUserStatusByUsername,
} from './presenceSlice';

describe('presenceSlice', () => {
    const initialState = {
        users: {},
    };

    it('should handle setOnlineUsers', () => {
        const users = [
            { userId: '1', username: 'alice', status: { text: 'Available' } },
            { userId: '2', username: 'bob' },
        ];
        const state = presenceReducer(initialState, setOnlineUsers(users));
        expect(state.users['1']).toEqual({
            userId: '1',
            username: 'alice',
            status: 'online',
            customStatus: { text: 'Available' },
        });
        expect(state.users['2']).toEqual({
            userId: '2',
            username: 'bob',
            status: 'online',
            customStatus: null,
        });
    });

    it('should handle setUserOnline', () => {
        const user = {
            userId: '1',
            username: 'alice',
            status: { text: 'Coding' },
        };
        const state = presenceReducer(initialState, setUserOnline(user));
        expect(state.users['1']).toEqual({
            userId: '1',
            username: 'alice',
            status: 'online',
            customStatus: { text: 'Coding' },
        });
    });

    it('should handle setUserOffline', () => {
        const existingState = {
            users: {
                '1': {
                    userId: '1',
                    username: 'alice',
                    status: 'online' as const,
                    customStatus: { text: 'Coding' },
                },
            },
        };
        const state = presenceReducer(
            existingState,
            setUserOffline({ userId: '1', username: 'alice' }),
        );
        expect(state.users['1'].status).toBe('offline');
        expect(state.users['1'].customStatus).toBeNull();
    });

    it('should handle setUserOffline for unknown user', () => {
        const state = presenceReducer(
            initialState,
            setUserOffline({ userId: '2', username: 'bob' }),
        );
        expect(state.users['2']).toEqual({
            userId: '2',
            username: 'bob',
            status: 'offline',
            customStatus: null,
        });
    });

    it('should handle updateUserStatusByUsername', () => {
        const existingState = {
            users: {
                '1': {
                    userId: '1',
                    username: 'alice',
                    status: 'online' as const,
                    customStatus: null,
                },
                '2': {
                    userId: '2',
                    username: 'bob',
                    status: 'online' as const,
                    customStatus: null,
                },
            },
        };
        const state = presenceReducer(
            existingState,
            updateUserStatusByUsername({
                username: 'alice',
                customStatus: { text: 'Eating' },
            }),
        );
        expect(state.users['1'].customStatus).toEqual({ text: 'Eating' });
        expect(state.users['2'].customStatus).toBeNull();
    });
});
