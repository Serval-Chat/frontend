import { describe, expect, it } from 'vitest';

import {
    decrementServerPing,
    incrementServerPing,
    setDmUnread,
    setServerPingCount,
    setServerUnread,
    setUnreadDms,
    setUnreadServers,
    unreadReducer,
} from './unreadSlice';

describe('unreadSlice', (): void => {
    const initialState = {
        unreadServers: {},
        unreadDms: {},
    };

    describe('setUnreadServers', (): void => {
        it('replaces the entire unreadServers map', (): void => {
            const state = unreadReducer(
                initialState,
                setUnreadServers({
                    server1: { hasUnread: true, pingCount: 3 },
                }),
            );
            expect(state.unreadServers).toEqual({
                server1: { hasUnread: true, pingCount: 3 },
            });
        });
    });

    describe('setServerUnread', (): void => {
        it('creates an entry with hasUnread=true and pingCount=0 when none exists', (): void => {
            const state = unreadReducer(
                initialState,
                setServerUnread({ serverId: 'srv1', unread: true }),
            );
            expect(state.unreadServers.srv1).toEqual({
                hasUnread: true,
                pingCount: 0,
            });
        });

        it('updates hasUnread without touching pingCount when entry already exists', (): void => {
            const existing = {
                unreadServers: {
                    srv1: { hasUnread: false, pingCount: 5 },
                },
                unreadDms: {},
            };
            const state = unreadReducer(
                existing,
                setServerUnread({ serverId: 'srv1', unread: true }),
            );
            expect(state.unreadServers.srv1).toEqual({
                hasUnread: true,
                pingCount: 5, // unchanged
            });
        });
    });

    describe('setServerPingCount', (): void => {
        it('creates an entry with the given count when none exists', (): void => {
            const state = unreadReducer(
                initialState,
                setServerPingCount({ serverId: 'srv1', count: 7 }),
            );
            expect(state.unreadServers.srv1?.pingCount).toBe(7);
        });

        it('overwrites an existing ping count', (): void => {
            const existing = {
                unreadServers: { srv1: { hasUnread: true, pingCount: 3 } },
                unreadDms: {},
            };
            const state = unreadReducer(
                existing,
                setServerPingCount({ serverId: 'srv1', count: 1 }),
            );
            expect(state.unreadServers.srv1?.pingCount).toBe(1);
        });
    });

    describe('incrementServerPing', (): void => {
        it('creates an entry with pingCount=1 when none exists', (): void => {
            const state = unreadReducer(
                initialState,
                incrementServerPing({ serverId: 'srv1' }),
            );
            expect(state.unreadServers.srv1).toEqual({
                hasUnread: false,
                pingCount: 1,
            });
        });

        it('increments the ping count by exactly 1 each call', (): void => {
            let state = unreadReducer(
                initialState,
                incrementServerPing({ serverId: 'srv1' }),
            );
            state = unreadReducer(
                state,
                incrementServerPing({ serverId: 'srv1' }),
            );
            state = unreadReducer(
                state,
                incrementServerPing({ serverId: 'srv1' }),
            );
            expect(state.unreadServers.srv1?.pingCount).toBe(3);
        });

        it('does not double-count when the same dispatch is made once', (): void => {
            const state = unreadReducer(
                initialState,
                incrementServerPing({ serverId: 'srv1' }),
            );
            expect(state.unreadServers.srv1?.pingCount).toBe(1);
        });
    });

    describe('decrementServerPing', (): void => {
        it('decrements the ping count by 1', (): void => {
            const existing = {
                unreadServers: { srv1: { hasUnread: true, pingCount: 3 } },
                unreadDms: {},
            };
            const state = unreadReducer(
                existing,
                decrementServerPing({ serverId: 'srv1' }),
            );
            expect(state.unreadServers.srv1?.pingCount).toBe(2);
        });

        it('does not go below 0', (): void => {
            const existing = {
                unreadServers: { srv1: { hasUnread: false, pingCount: 0 } },
                unreadDms: {},
            };
            const state = unreadReducer(
                existing,
                decrementServerPing({ serverId: 'srv1' }),
            );
            expect(state.unreadServers.srv1?.pingCount).toBe(0);
        });

        it('does nothing for an unknown server', (): void => {
            const state = unreadReducer(
                initialState,
                decrementServerPing({ serverId: 'unknown' }),
            );
            expect(state.unreadServers.unknown).toBeUndefined();
        });
    });

    describe('setUnreadDms', (): void => {
        it('replaces the entire unreadDms map', (): void => {
            const state = unreadReducer(
                initialState,
                setUnreadDms({ user1: 4, user2: 0 }),
            );
            expect(state.unreadDms).toEqual({ user1: 4, user2: 0 });
        });
    });

    describe('setDmUnread', (): void => {
        it('sets the DM unread count for a user', (): void => {
            const state = unreadReducer(
                initialState,
                setDmUnread({ userId: 'user1', count: 5 }),
            );
            expect(state.unreadDms.user1).toBe(5);
        });

        it('receiving the same DM_UNREAD_UPDATED count twice does not double-count', (): void => {
            let state = unreadReducer(
                initialState,
                setDmUnread({ userId: 'user1', count: 1 }),
            );
            state = unreadReducer(
                state,
                setDmUnread({ userId: 'user1', count: 1 }),
            );
            expect(state.unreadDms.user1).toBe(1);
        });

        it('clears DM ping when count is set to 0', (): void => {
            let state = unreadReducer(
                initialState,
                setDmUnread({ userId: 'user1', count: 3 }),
            );
            state = unreadReducer(
                state,
                setDmUnread({ userId: 'user1', count: 0 }),
            );
            expect(state.unreadDms.user1).toBe(0);
        });

        it('clears DM unread badge after read acknowledgement (count → 0)', (): void => {
            const withPing = {
                unreadServers: {},
                unreadDms: { user1: 2 },
            };
            const state = unreadReducer(
                withPing,
                setDmUnread({ userId: 'user1', count: 0 }),
            );
            expect(state.unreadDms.user1).toBe(0);
        });
    });

    describe('DM ping while in server view', (): void => {
        it('updating a DM count does not affect server ping state', (): void => {
            const serverState = {
                unreadServers: { srv1: { hasUnread: false, pingCount: 2 } },
                unreadDms: {},
            };
            const state = unreadReducer(
                serverState,
                setDmUnread({ userId: 'user1', count: 3 }),
            );
            expect(state.unreadServers.srv1?.pingCount).toBe(2);
            expect(state.unreadDms.user1).toBe(3);
        });

        it('a server ping increment does not affect DM unread counts', (): void => {
            const dmState = {
                unreadServers: {},
                unreadDms: { user1: 2 },
            };
            const state = unreadReducer(
                dmState,
                incrementServerPing({ serverId: 'srv1' }),
            );
            expect(state.unreadDms.user1).toBe(2);
            expect(state.unreadServers.srv1?.pingCount).toBe(1);
        });
    });
});
