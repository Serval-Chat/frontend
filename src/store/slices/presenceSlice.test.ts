import { describe, expect, it } from 'vitest';

import {
    presenceReducer,
    setOnlineUsers,
    setUserOffline,
    setUserOnline,
    updatePresenceStatus,
    updateUserStatusByUsername,
} from './presenceSlice';

describe('presenceSlice', (): void => {
    const initialState = {
        users: {},
        backendInstanceId: null,
    };

    it('should handle setOnlineUsers', (): void => {
        const users = [
            { userId: '1', username: 'alice', status: { text: 'Available' } },
            { userId: '2', username: 'bob' },
        ];
        const state = presenceReducer(initialState, setOnlineUsers(users));
        expect(state.users['1']).toEqual({
            userId: '1',
            username: 'alice',
            status: 'online',
            presenceStatus: 'online',
            customStatus: { text: 'Available' },
        });
        expect(state.users['2']).toEqual({
            userId: '2',
            username: 'bob',
            status: 'online',
            presenceStatus: 'online',
            customStatus: null,
        });
    });

    it('should handle setUserOnline', (): void => {
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
            presenceStatus: 'online',
            customStatus: { text: 'Coding' },
        });
    });

    it('should handle setUserOffline', (): void => {
        const existingState = {
            users: {
                '1': {
                    userId: '1',
                    username: 'alice',
                    status: 'online' as const,
                    customStatus: { text: 'Coding' },
                },
            },
            backendInstanceId: null,
        };
        const state = presenceReducer(
            existingState,
            setUserOffline({ userId: '1', username: 'alice' }),
        );
        expect(state.users['1']?.status).toBe('offline');
        expect(state.users['1']?.customStatus).toBeNull();
    });

    it('should handle setUserOffline for unknown user', (): void => {
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

    it('should handle setOnlineUsers with an explicit offline presenceStatus (invisible mode)', (): void => {
        const users = [
            {
                userId: '1',
                username: 'alice',
                presenceStatus: 'offline' as const,
            },
        ];
        const state = presenceReducer(initialState, setOnlineUsers(users));
        expect(state.users['1']).toEqual({
            userId: '1',
            username: 'alice',
            status: 'online',
            presenceStatus: 'offline',
            customStatus: null,
        });
    });

    it('should handle updatePresenceStatus for an existing user', (): void => {
        const existingState = {
            users: {
                '1': {
                    userId: '1',
                    username: 'alice',
                    status: 'online' as const,
                    presenceStatus: 'online' as const,
                    customStatus: null,
                },
            },
            backendInstanceId: null,
        };
        const state = presenceReducer(
            existingState,
            updatePresenceStatus({ userId: '1', presenceStatus: 'offline' }),
        );
        expect(state.users['1']?.presenceStatus).toBe('offline');
        expect(state.users['1']?.status).toBe('online');
    });

    it('should handle updatePresenceStatus for an unknown user', (): void => {
        const state = presenceReducer(
            initialState,
            updatePresenceStatus({
                userId: '2',
                presenceStatus: 'offline',
            }),
        );
        expect(state.users['2']).toEqual({
            userId: '2',
            status: 'online',
            presenceStatus: 'offline',
            customStatus: null,
        });
    });

    it('should handle updateUserStatusByUsername', (): void => {
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
            backendInstanceId: null,
        };
        const state = presenceReducer(
            existingState,
            updateUserStatusByUsername({
                username: 'alice',
                customStatus: { text: 'Eating' },
            }),
        );
        expect(state.users['1']?.customStatus).toEqual({ text: 'Eating' });
        expect(state.users['2']?.customStatus).toBeNull();
    });
});
