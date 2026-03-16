/**
 * Tests for setupGlobalWsHandlers - specifically around ping (mention)
 * deduplication and automatic ping-clearing when a message is viewed.
 *
 * Strategy
 * --------
 * We call setupGlobalWsHandlers() with a mock QueryClient and a mock Redux
 * dispatch, then simulate raw WebSocket messages (just as wsClient.test.ts
 * does) by calling the onmessage handler with a serialised WS envelope.
 * This lets us exercise the real handler logic without spinning up a full
 * React tree.
 */
import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { PingNotification } from '@/api/pings/pings.types';
import {
    decrementServerPing,
    incrementServerPing,
    setDmUnread,
    setServerPingCount,
} from '@/store/slices/unreadSlice';

import { wsClient } from './client';
import { WsEvents } from './events';
import { setupGlobalWsHandlers } from './handlers';

interface MockWebSocket {
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    readyState: number;
    onopen: ((ev: Event) => void) | null;
    onmessage: ((ev: MessageEvent) => void) | null;
    onerror: ((ev: Event) => void) | null;
    onclose: ((ev: CloseEvent) => void) | null;
}

function emitWsEvent(
    mockWs: MockWebSocket,
    type: string,
    payload: unknown,
): void {
    if (!mockWs.onmessage) return;
    mockWs.onmessage({
        data: JSON.stringify({
            event: { type, payload },
            meta: { ts: Date.now() },
        }),
    } as MessageEvent);
}

const PINGS_KEY = ['pings'];

describe('setupGlobalWsHandlers - ping behaviour', () => {
    let mockWs: MockWebSocket;
    let queryClient: QueryClient;
    let mockDispatch: ReturnType<typeof vi.fn>;
    let dispatch: Dispatch<UnknownAction>;
    let cleanup: () => void;

    beforeEach(() => {
        vi.clearAllMocks();

        wsClient.disconnect();

        mockWs = {
            send: vi.fn(),
            close: vi.fn(),
            readyState: 1,
            onopen: null,
            onmessage: null,
            onerror: null,
            onclose: null,
        };

        class WebSocketMock {
            static CONNECTING = 0;
            static OPEN = 1;
            static CLOSING = 2;
            static CLOSED = 3;
            constructor() {
                return mockWs as unknown as WebSocket;
            }
        }
        vi.stubGlobal('WebSocket', WebSocketMock);

        wsClient.connect('test-token');

        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        mockDispatch = vi.fn();
        dispatch = mockDispatch as unknown as Dispatch<UnknownAction>;

        cleanup = setupGlobalWsHandlers(queryClient, dispatch);
    });

    afterEach(() => {
        cleanup();
        queryClient.clear();
    });

    describe('MENTION event (server channel)', () => {
        const serverId = 'server-abc';
        const channelId = 'channel-xyz';

        const mentionPayload = {
            type: 'mention' as const,
            senderId: 'user-1',
            sender: 'alice',
            serverId,
            channelId,
            message: {
                messageId: 'msg-001',
                serverId,
                channelId,
                senderId: 'user-1',
                senderUsername: 'alice',
                text: 'hey @you',
                createdAt: new Date().toISOString(),
                isEdited: false,
                isWebhook: false,
            },
        };

        it('adds exactly ONE ping to the cache and dispatches incrementServerPing once', () => {
            emitWsEvent(mockWs, WsEvents.MENTION, mentionPayload);

            const cached = queryClient.getQueryData<{
                pings: PingNotification[];
            }>(PINGS_KEY);

            expect(cached?.pings).toHaveLength(1);
            expect(cached?.pings[0].id).toBe('msg-001');

            expect(dispatch).toHaveBeenCalledWith(
                incrementServerPing({ serverId }),
            );
            expect(dispatch).toHaveBeenCalledTimes(1);
        });

        it('does NOT add a duplicate ping when the same message arrives twice', () => {
            emitWsEvent(mockWs, WsEvents.MENTION, mentionPayload);
            emitWsEvent(mockWs, WsEvents.MENTION, mentionPayload);

            const cached = queryClient.getQueryData<{
                pings: PingNotification[];
            }>(PINGS_KEY);

            expect(cached?.pings).toHaveLength(1);

            const incrementCalls = mockDispatch.mock.calls.filter(
                (call: unknown[]) =>
                    JSON.stringify(call[0]) ===
                    JSON.stringify(incrementServerPing({ serverId })),
            );
            expect(incrementCalls).toHaveLength(2);
            expect(cached?.pings).toHaveLength(1);
        });

        it('accumulates distinct pings from different messages', () => {
            emitWsEvent(mockWs, WsEvents.MENTION, mentionPayload);
            emitWsEvent(mockWs, WsEvents.MENTION, {
                ...mentionPayload,
                message: { ...mentionPayload.message, messageId: 'msg-002' },
            });

            const cached = queryClient.getQueryData<{
                pings: PingNotification[];
            }>(PINGS_KEY);

            expect(cached?.pings).toHaveLength(2);
        });

        it('server ping is cleared after useClearChannelPings (simulated via setServerPingCount)', () => {
            emitWsEvent(mockWs, WsEvents.MENTION, mentionPayload);

            dispatch(setServerPingCount({ serverId, count: 0 }));

            expect(dispatch).toHaveBeenCalledWith(
                setServerPingCount({ serverId, count: 0 }),
            );
        });

        it('server ping decrements by one after useDeletePing (simulated via decrementServerPing)', () => {
            emitWsEvent(mockWs, WsEvents.MENTION, mentionPayload);
            emitWsEvent(mockWs, WsEvents.MENTION, {
                ...mentionPayload,
                message: { ...mentionPayload.message, messageId: 'msg-002' },
            });

            dispatch(decrementServerPing({ serverId }));

            expect(dispatch).toHaveBeenCalledWith(
                decrementServerPing({ serverId }),
            );
        });
    });

    describe('DM_UNREAD_UPDATED event (received while in server view)', () => {
        it('updates the DM unread count via setDmUnread', () => {
            emitWsEvent(mockWs, WsEvents.DM_UNREAD_UPDATED, {
                peerId: 'user-42',
                count: 1,
            });

            expect(dispatch).toHaveBeenCalledWith(
                setDmUnread({ userId: 'user-42', count: 1 }),
            );
        });

        it('receiving the same DM_UNREAD_UPDATED count twice dispatches setDmUnread twice but the value stays the same (idempotent set)', () => {
            emitWsEvent(mockWs, WsEvents.DM_UNREAD_UPDATED, {
                peerId: 'user-42',
                count: 1,
            });
            emitWsEvent(mockWs, WsEvents.DM_UNREAD_UPDATED, {
                peerId: 'user-42',
                count: 1,
            });

            const dmCalls = mockDispatch.mock.calls.filter(
                (call: unknown[]) =>
                    JSON.stringify(call[0]) ===
                    JSON.stringify(
                        setDmUnread({ userId: 'user-42', count: 1 }),
                    ),
            );
            expect(dmCalls).toHaveLength(2);
        });

        it('clears the DM ping when DM_UNREAD_UPDATED arrives with count=0', () => {
            emitWsEvent(mockWs, WsEvents.DM_UNREAD_UPDATED, {
                peerId: 'user-42',
                count: 3,
            });

            emitWsEvent(mockWs, WsEvents.DM_UNREAD_UPDATED, {
                peerId: 'user-42',
                count: 0,
            });

            expect(dispatch).toHaveBeenLastCalledWith(
                setDmUnread({ userId: 'user-42', count: 0 }),
            );
        });
    });

    describe('server ping cleared when the pinged channel is viewed', () => {
        const serverId = 'server-abc';
        const channelId = 'channel-xyz';

        it('setServerPingCount(0) clears the badge after the user reads the channel', () => {
            emitWsEvent(mockWs, WsEvents.MENTION, {
                type: 'mention',
                senderId: 'user-1',
                sender: 'alice',
                serverId,
                channelId,
                message: {
                    messageId: 'msg-999',
                    serverId,
                    channelId,
                    senderId: 'user-1',
                    senderUsername: 'alice',
                    text: 'hello',
                    createdAt: new Date().toISOString(),
                    isEdited: false,
                    isWebhook: false,
                },
            });

            const cached = queryClient.getQueryData<{
                pings: PingNotification[];
            }>(PINGS_KEY);
            expect(cached?.pings).toHaveLength(1);

            queryClient.setQueryData<{ pings: PingNotification[] }>(
                PINGS_KEY,
                (old) => {
                    if (!old) return old;
                    return {
                        ...old,
                        pings: old.pings.filter(
                            (p) => p.channelId !== channelId,
                        ),
                    };
                },
            );
            dispatch(setServerPingCount({ serverId, count: 0 }));

            const afterClear = queryClient.getQueryData<{
                pings: PingNotification[];
            }>(PINGS_KEY);
            expect(afterClear?.pings).toHaveLength(0);

            expect(dispatch).toHaveBeenCalledWith(
                setServerPingCount({ serverId, count: 0 }),
            );
        });
    });
});
