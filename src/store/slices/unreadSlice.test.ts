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

describe('unreadSlice', () => {
    const initialState = {
        unreadServers: {},
        unreadDms: {},
    };

    describe('setUnreadServers', () => {
        it('replaces the entire unreadServers map', () => {
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

    describe('setServerUnread', () => {
        it('creates an entry with hasUnread=true and pingCount=0 when none exists', () => {
            const state = unreadReducer(
                initialState,
                setServerUnread({ serverId: 'srv1', unread: true }),
            );
            expect(state.unreadServers['srv1']).toEqual({
                hasUnread: true,
                pingCount: 0,
            });
        });

        it('updates hasUnread without touching pingCount when entry already exists', () => {
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
            expect(state.unreadServers['srv1']).toEqual({
                hasUnread: true,
                pingCount: 5, // unchanged
            });
        });
    });

    describe('setServerPingCount', () => {
        it('creates an entry with the given count when none exists', () => {
            const state = unreadReducer(
                initialState,
                setServerPingCount({ serverId: 'srv1', count: 7 }),
            );
            expect(state.unreadServers['srv1'].pingCount).toBe(7);
        });

        it('overwrites an existing ping count', () => {
            const existing = {
                unreadServers: { srv1: { hasUnread: true, pingCount: 3 } },
                unreadDms: {},
            };
            const state = unreadReducer(
                existing,
                setServerPingCount({ serverId: 'srv1', count: 1 }),
            );
            expect(state.unreadServers['srv1'].pingCount).toBe(1);
        });
    });

    describe('incrementServerPing', () => {
        it('creates an entry with pingCount=1 when none exists', () => {
            const state = unreadReducer(
                initialState,
                incrementServerPing({ serverId: 'srv1' }),
            );
            expect(state.unreadServers['srv1']).toEqual({
                hasUnread: false,
                pingCount: 1,
            });
        });

        it('increments the ping count by exactly 1 each call', () => {
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
            expect(state.unreadServers['srv1'].pingCount).toBe(3);
        });

        it('does not double-count when the same dispatch is made once', () => {
            const state = unreadReducer(
                initialState,
                incrementServerPing({ serverId: 'srv1' }),
            );
            expect(state.unreadServers['srv1'].pingCount).toBe(1);
        });
    });

    describe('decrementServerPing', () => {
        it('decrements the ping count by 1', () => {
            const existing = {
                unreadServers: { srv1: { hasUnread: true, pingCount: 3 } },
                unreadDms: {},
            };
            const state = unreadReducer(
                existing,
                decrementServerPing({ serverId: 'srv1' }),
            );
            expect(state.unreadServers['srv1'].pingCount).toBe(2);
        });

        it('does not go below 0', () => {
            const existing = {
                unreadServers: { srv1: { hasUnread: false, pingCount: 0 } },
                unreadDms: {},
            };
            const state = unreadReducer(
                existing,
                decrementServerPing({ serverId: 'srv1' }),
            );
            expect(state.unreadServers['srv1'].pingCount).toBe(0);
        });

        it('does nothing for an unknown server', () => {
            const state = unreadReducer(
                initialState,
                decrementServerPing({ serverId: 'unknown' }),
            );
            expect(state.unreadServers['unknown']).toBeUndefined();
        });
    });

    describe('setUnreadDms', () => {
        it('replaces the entire unreadDms map', () => {
            const state = unreadReducer(
                initialState,
                setUnreadDms({ user1: 4, user2: 0 }),
            );
            expect(state.unreadDms).toEqual({ user1: 4, user2: 0 });
        });
    });

    describe('setDmUnread', () => {
        it('sets the DM unread count for a user', () => {
            const state = unreadReducer(
                initialState,
                setDmUnread({ userId: 'user1', count: 5 }),
            );
            expect(state.unreadDms['user1']).toBe(5);
        });

        it('receiving the same DM_UNREAD_UPDATED count twice does not double-count', () => {
            let state = unreadReducer(
                initialState,
                setDmUnread({ userId: 'user1', count: 1 }),
            );
            state = unreadReducer(
                state,
                setDmUnread({ userId: 'user1', count: 1 }),
            );
            expect(state.unreadDms['user1']).toBe(1);
        });

        it('clears DM ping when count is set to 0', () => {
            let state = unreadReducer(
                initialState,
                setDmUnread({ userId: 'user1', count: 3 }),
            );
            state = unreadReducer(
                state,
                setDmUnread({ userId: 'user1', count: 0 }),
            );
            expect(state.unreadDms['user1']).toBe(0);
        });

        it('clears DM unread badge after read acknowledgement (count → 0)', () => {
            const withPing = {
                unreadServers: {},
                unreadDms: { user1: 2 },
            };
            const state = unreadReducer(
                withPing,
                setDmUnread({ userId: 'user1', count: 0 }),
            );
            expect(state.unreadDms['user1']).toBe(0);
        });
    });

    describe('DM ping while in server view', () => {
        it('updating a DM count does not affect server ping state', () => {
            const serverState = {
                unreadServers: { srv1: { hasUnread: false, pingCount: 2 } },
                unreadDms: {},
            };
            const state = unreadReducer(
                serverState,
                setDmUnread({ userId: 'user1', count: 3 }),
            );
            expect(state.unreadServers['srv1'].pingCount).toBe(2);
            expect(state.unreadDms['user1']).toBe(3);
        });

        it('a server ping increment does not affect DM unread counts', () => {
            const dmState = {
                unreadServers: {},
                unreadDms: { user1: 2 },
            };
            const state = unreadReducer(
                dmState,
                incrementServerPing({ serverId: 'srv1' }),
            );
            expect(state.unreadDms['user1']).toBe(2);
            expect(state.unreadServers['srv1'].pingCount).toBe(1);
        });
    });
});
