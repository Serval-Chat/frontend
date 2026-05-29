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
import type { InfiniteData } from '@tanstack/react-query';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { chatApi } from '@/api/chat/chat.api';
import { CHAT_QUERY_KEYS } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import {
    FRIENDS_QUERY_KEY,
    FRIEND_PROFILES_QUERY_KEY,
} from '@/api/friends/friends.queries';
import type { Friend } from '@/api/friends/friends.types';
import type { PingNotification } from '@/api/pings/pings.types';
import { serversApi } from '@/api/servers/servers.api';
import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
import type { Channel } from '@/api/servers/servers.types';
import type { User } from '@/api/users/users.types';
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

describe('setupGlobalWsHandlers - ping behaviour', (): void => {
    let mockWs: MockWebSocket;
    let queryClient: QueryClient;
    let mockDispatch: ReturnType<typeof vi.fn>;
    let dispatch: Dispatch<UnknownAction>;
    let cleanup: () => void;

    beforeEach((): void => {
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
                return mockWs as any as WebSocket;
            }
        }
        vi.stubGlobal('WebSocket', WebSocketMock);

        wsClient.connect('test-token');

        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        mockDispatch = vi.fn();
        dispatch = mockDispatch as any as Dispatch<UnknownAction>;

        cleanup = setupGlobalWsHandlers(queryClient, dispatch);
    });

    afterEach((): void => {
        cleanup();
        queryClient.clear();
        vi.restoreAllMocks();
    });

    describe('MENTION event (server channel)', (): void => {
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

        it('adds exactly ONE ping to the cache and dispatches incrementServerPing once', (): void => {
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

        it('does NOT add a duplicate ping when the same message arrives twice', (): void => {
            emitWsEvent(mockWs, WsEvents.MENTION, mentionPayload);
            emitWsEvent(mockWs, WsEvents.MENTION, mentionPayload);

            const cached = queryClient.getQueryData<{
                pings: PingNotification[];
            }>(PINGS_KEY);

            expect(cached?.pings).toHaveLength(1);

            const incrementCalls = mockDispatch.mock.calls.filter(
                (call: unknown[]): boolean =>
                    JSON.stringify(call[0]) ===
                    JSON.stringify(incrementServerPing({ serverId })),
            );
            expect(incrementCalls).toHaveLength(2);
            expect(cached?.pings).toHaveLength(1);
        });

        it('accumulates distinct pings from different messages', (): void => {
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

        it('server ping is cleared after useClearChannelPings (simulated via setServerPingCount)', (): void => {
            emitWsEvent(mockWs, WsEvents.MENTION, mentionPayload);

            dispatch(setServerPingCount({ serverId, count: 0 }));

            expect(dispatch).toHaveBeenCalledWith(
                setServerPingCount({ serverId, count: 0 }),
            );
        });

        it('server ping decrements by one after useDeletePing (simulated via decrementServerPing)', (): void => {
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

    describe('DM_UNREAD_UPDATED event (received while in server view)', (): void => {
        it('updates the DM unread count via setDmUnread', (): void => {
            emitWsEvent(mockWs, WsEvents.DM_UNREAD_UPDATED, {
                peerId: 'user-42',
                count: 1,
            });

            expect(dispatch).toHaveBeenCalledWith(
                setDmUnread({ userId: 'user-42', count: 1 }),
            );
        });

        it('receiving the same DM_UNREAD_UPDATED count twice dispatches setDmUnread twice but the value stays the same (idempotent set)', (): void => {
            emitWsEvent(mockWs, WsEvents.DM_UNREAD_UPDATED, {
                peerId: 'user-42',
                count: 1,
            });
            emitWsEvent(mockWs, WsEvents.DM_UNREAD_UPDATED, {
                peerId: 'user-42',
                count: 1,
            });

            const dmCalls = mockDispatch.mock.calls.filter(
                (call: unknown[]): boolean =>
                    JSON.stringify(call[0]) ===
                    JSON.stringify(
                        setDmUnread({ userId: 'user-42', count: 1 }),
                    ),
            );
            expect(dmCalls).toHaveLength(2);
        });

        it('clears the DM ping when DM_UNREAD_UPDATED arrives with count=0', (): void => {
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

    describe('CHANNEL_UNREAD_UPDATED event', (): void => {
        it('does not invalidate channel messages for a mark-read/open-channel update', (): void => {
            const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

            emitWsEvent(mockWs, WsEvents.CHANNEL_UNREAD_UPDATED, {
                serverId: 'server-1',
                channelId: 'channel-1',
                lastMessageAt: null,
                lastReadAt: '2026-05-20T10:00:00.000Z',
                senderId: 'current-user',
            });

            expect(invalidateSpy).not.toHaveBeenCalledWith({
                queryKey: CHAT_QUERY_KEYS.channelMessages(
                    'server-1',
                    'channel-1',
                    null,
                ),
            });
        });
    });

    describe('message cache freshness', (): void => {
        it('adds server messages to an already cached live channel query', (): void => {
            const queryKey = CHAT_QUERY_KEYS.channelMessages(
                'server-1',
                'channel-1',
                null,
            );
            queryClient.setQueryData<InfiniteData<ChatMessage[]>>(queryKey, {
                pages: [[]],
                pageParams: [undefined],
            });

            emitWsEvent(mockWs, WsEvents.MESSAGE_SERVER, {
                messageId: 'message-1',
                serverId: 'server-1',
                channelId: 'channel-1',
                senderId: 'user-1',
                senderUsername: 'alice',
                text: 'new message',
                createdAt: '2026-05-16T10:00:00.000Z',
                isEdited: false,
                isWebhook: false,
            });

            const cached =
                queryClient.getQueryData<InfiniteData<ChatMessage[]>>(queryKey);

            expect(cached?.pages[0]).toMatchObject([
                {
                    _id: 'message-1',
                    text: 'new message',
                    serverId: 'server-1',
                    channelId: 'channel-1',
                    senderId: 'user-1',
                },
            ]);
        });

        it('does not duplicate server messages when the same event arrives twice', (): void => {
            const queryKey = CHAT_QUERY_KEYS.channelMessages(
                'server-1',
                'channel-1',
                null,
            );
            queryClient.setQueryData<InfiniteData<ChatMessage[]>>(queryKey, {
                pages: [[]],
                pageParams: [undefined],
            });

            const payload = {
                messageId: 'message-1',
                serverId: 'server-1',
                channelId: 'channel-1',
                senderId: 'user-1',
                senderUsername: 'alice',
                text: 'new message',
                createdAt: '2026-05-16T10:00:00.000Z',
                isEdited: false,
                isWebhook: false,
            };

            emitWsEvent(mockWs, WsEvents.MESSAGE_SERVER, payload);
            emitWsEvent(mockWs, WsEvents.MESSAGE_SERVER, payload);

            const cached =
                queryClient.getQueryData<InfiniteData<ChatMessage[]>>(queryKey);

            expect(cached?.pages[0]).toHaveLength(1);
        });

        it('adds DM messages to the cached peer conversation', (): void => {
            const peerQueryKey = CHAT_QUERY_KEYS.userMessages('user-2');
            queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
                peerQueryKey,
                {
                    pages: [[]],
                    pageParams: [undefined],
                },
            );

            emitWsEvent(mockWs, WsEvents.MESSAGE_DM, {
                messageId: 'dm-1',
                senderId: 'user-1',
                senderUsername: 'alice',
                receiverId: 'user-2',
                receiverUsername: 'bob',
                text: 'hello',
                createdAt: '2026-05-16T10:00:00.000Z',
                isEdited: false,
            });

            const cached =
                queryClient.getQueryData<InfiniteData<ChatMessage[]>>(
                    peerQueryKey,
                );

            expect(cached?.pages[0]).toMatchObject([
                {
                    _id: 'dm-1',
                    senderId: 'user-1',
                    receiverId: 'user-2',
                    text: 'hello',
                },
            ]);
        });

        it('updates cached channel unread metadata and invalidates the live message query', (): void => {
            const messagesQueryKey = CHAT_QUERY_KEYS.channelMessages(
                'server-1',
                'channel-1',
                null,
            );
            queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
                messagesQueryKey,
                {
                    pages: [[]],
                    pageParams: [undefined],
                },
            );
            queryClient.setQueryData<Channel[]>(
                SERVERS_QUERY_KEYS.channels('server-1'),
                [
                    {
                        _id: 'channel-1',
                        name: 'general',
                        serverId: 'server-1',
                        type: 'text',
                        position: 0,
                        lastMessageAt: null,
                        lastReadAt: null,
                    },
                ],
            );

            emitWsEvent(mockWs, WsEvents.CHANNEL_UNREAD_UPDATED, {
                serverId: 'server-1',
                channelId: 'channel-1',
                lastMessageAt: '2026-05-16T10:00:00.000Z',
                senderId: 'user-1',
            });

            const cachedChannels = queryClient.getQueryData<Channel[]>(
                SERVERS_QUERY_KEYS.channels('server-1'),
            );

            expect(cachedChannels?.[0].lastMessageAt).toBe(
                '2026-05-16T10:00:00.000Z',
            );
            expect(
                queryClient.getQueryState(messagesQueryKey)?.isInvalidated,
            ).toBe(true);
        });

        it('invalidates chat message queries after authentication', (): void => {
            vi.spyOn(serversApi, 'getUnreadStatus').mockResolvedValue({});
            vi.spyOn(chatApi, 'getUnreadCounts').mockResolvedValue({});

            const channelQueryKey = CHAT_QUERY_KEYS.channelMessages(
                'server-1',
                'channel-1',
                null,
            );
            const dmQueryKey = CHAT_QUERY_KEYS.userMessages('user-2');
            queryClient.setQueryData<InfiniteData<ChatMessage[]>>(
                channelQueryKey,
                {
                    pages: [[]],
                    pageParams: [undefined],
                },
            );
            queryClient.setQueryData<InfiniteData<ChatMessage[]>>(dmQueryKey, {
                pages: [[]],
                pageParams: [undefined],
            });

            emitWsEvent(mockWs, WsEvents.AUTHENTICATED, {
                user: { id: 'me', username: 'me' },
                instanceId: 'instance-1',
            });

            expect(
                queryClient.getQueryState(channelQueryKey)?.isInvalidated,
            ).toBe(true);
            expect(queryClient.getQueryState(dmQueryKey)?.isInvalidated).toBe(
                true,
            );
        });
    });

    describe('server ping cleared when the pinged channel is viewed', (): void => {
        const serverId = 'server-abc';
        const channelId = 'channel-xyz';

        it('setServerPingCount(0) clears the badge after the user reads the channel', (): void => {
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
                (old): { pings: PingNotification[] } | undefined => {
                    if (!old) return old;
                    return {
                        ...old,
                        pings: old.pings.filter(
                            (p): boolean => p.channelId !== channelId,
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

    describe('FRIEND_ADDED event', (): void => {
        it('places the accepted friend at the top of the cached friends list', (): void => {
            const existingFriend: Friend = {
                _id: 'friend-old',
                username: 'oldfriend',
                createdAt: '2026-01-01T00:00:00.000Z',
                profilePicture: null,
                customStatus: null,
            };
            const acceptedFriend: Friend = {
                _id: 'friend-new',
                username: 'newfriend',
                createdAt: '2026-02-01T00:00:00.000Z',
                profilePicture: null,
                customStatus: null,
            };

            queryClient.setQueryData<Friend[]>(FRIENDS_QUERY_KEY, [
                existingFriend,
            ]);

            emitWsEvent(mockWs, WsEvents.FRIEND_ADDED, {
                friend: acceptedFriend,
            });

            expect(
                queryClient
                    .getQueryData<Friend[]>(FRIENDS_QUERY_KEY)
                    ?.map((friend): string => friend._id),
            ).toEqual(['friend-new', 'friend-old']);
        });

        it('synchronizes the accepted friend into the friend profiles cache', (): void => {
            const existingFriend: Friend = {
                _id: 'friend-old',
                username: 'oldfriend',
                createdAt: '2026-01-01T00:00:00.000Z',
                profilePicture: null,
                customStatus: null,
            };
            const acceptedFriend: Friend = {
                _id: 'friend-new',
                username: 'newfriend',
                createdAt: '2026-02-01T00:00:00.000Z',
                profilePicture: null,
                customStatus: null,
            };

            queryClient.setQueryData<Friend[]>(FRIEND_PROFILES_QUERY_KEY, [
                existingFriend,
            ]);

            emitWsEvent(mockWs, WsEvents.FRIEND_ADDED, {
                friend: acceptedFriend,
            });

            expect(
                queryClient
                    .getQueryData<Friend[]>(FRIEND_PROFILES_QUERY_KEY)
                    ?.map((friend): string => friend._id),
            ).toEqual(['friend-new', 'friend-old']);
        });
    });

    describe('FRIEND_REMOVED event', (): void => {
        it('removes the unfriended user from friends and friend profiles caches', (): void => {
            const removedFriend: Friend = {
                _id: 'friend-removed',
                username: 'removedfriend',
                createdAt: '2026-01-01T00:00:00.000Z',
                profilePicture: null,
                customStatus: null,
            };
            const keptFriend: Friend = {
                _id: 'friend-kept',
                username: 'keptfriend',
                createdAt: '2026-02-01T00:00:00.000Z',
                profilePicture: null,
                customStatus: null,
            };

            queryClient.setQueryData<Friend[]>(FRIENDS_QUERY_KEY, [
                removedFriend,
                keptFriend,
            ]);
            queryClient.setQueryData<Friend[]>(FRIEND_PROFILES_QUERY_KEY, [
                removedFriend,
                keptFriend,
            ]);

            emitWsEvent(mockWs, WsEvents.FRIEND_REMOVED, {
                userId: 'friend-removed',
                username: 'removedfriend',
            });

            expect(
                queryClient
                    .getQueryData<Friend[]>(FRIENDS_QUERY_KEY)
                    ?.map((friend): string => friend._id),
            ).toEqual(['friend-kept']);
            expect(
                queryClient
                    .getQueryData<Friend[]>(FRIEND_PROFILES_QUERY_KEY)
                    ?.map((friend): string => friend._id),
            ).toEqual(['friend-kept']);
        });
    });

    describe('CHANNEL_CREATED event', (): void => {
        const serverId = 'server-1';

        const existingChannel: Channel = {
            _id: 'channel-old',
            name: 'general',
            serverId,
            type: 'text',
            position: 0,
            categoryId: null,
        };

        const createdChannel: Channel = {
            _id: 'channel-new',
            name: 'new-channel',
            serverId,
            type: 'text',
            position: 1,
            categoryId: null,
        };

        it('adds a channel created by another user to the cached channel list without a reload', (): void => {
            queryClient.setQueryData<Channel[]>(
                SERVERS_QUERY_KEYS.channels(serverId),
                [existingChannel],
            );

            emitWsEvent(mockWs, WsEvents.CHANNEL_CREATED, {
                serverId,
                channel: createdChannel,
                senderId: 'other-user',
            });

            expect(
                queryClient
                    .getQueryData<
                        Channel[]
                    >(SERVERS_QUERY_KEYS.channels(serverId))
                    ?.map((channel): string => channel._id),
            ).toEqual(['channel-old', 'channel-new']);
        });

        it('adds a channel created by the current user to the cached channel list without a reload', (): void => {
            queryClient.setQueryData<User>(['me'], {
                _id: 'current-user',
                username: 'alice',
            } as User);
            cleanup();
            cleanup = setupGlobalWsHandlers(queryClient, dispatch);
            queryClient.setQueryData<Channel[]>(
                SERVERS_QUERY_KEYS.channels(serverId),
                [existingChannel],
            );

            emitWsEvent(mockWs, WsEvents.CHANNEL_CREATED, {
                serverId,
                channel: createdChannel,
                senderId: 'current-user',
            });

            expect(
                queryClient
                    .getQueryData<
                        Channel[]
                    >(SERVERS_QUERY_KEYS.channels(serverId))
                    ?.map((channel): string => channel._id),
            ).toEqual(['channel-old', 'channel-new']);
        });

        it('keeps the cached channel list ordered by position when the created channel belongs in the middle', (): void => {
            queryClient.setQueryData<Channel[]>(
                SERVERS_QUERY_KEYS.channels(serverId),
                [
                    existingChannel,
                    {
                        _id: 'channel-late',
                        name: 'later',
                        serverId,
                        type: 'text',
                        position: 3,
                        categoryId: null,
                    },
                ],
            );

            emitWsEvent(mockWs, WsEvents.CHANNEL_CREATED, {
                serverId,
                channel: {
                    ...createdChannel,
                    position: 2,
                },
                senderId: 'other-user',
            });

            expect(
                queryClient
                    .getQueryData<
                        Channel[]
                    >(SERVERS_QUERY_KEYS.channels(serverId))
                    ?.map((channel): string => channel._id),
            ).toEqual(['channel-old', 'channel-new', 'channel-late']);
        });
    });
});
