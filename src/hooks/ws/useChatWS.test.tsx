import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CHAT_QUERY_KEYS } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import { useChatWS } from '@/hooks/ws/useChatWS';
import { WsEvents } from '@/ws';

const webSocketHandlers = new Map<
    string,
    (payload: unknown) => void | Promise<void>
>();

vi.mock(
    '@/hooks/ws/useWebSocket',
    (): {
        useWebSocket: (
            event: string,
            callback: (payload: unknown) => void | Promise<void>,
        ) => void;
    } => ({
        useWebSocket: (
            event: string,
            callback: (payload: unknown) => void | Promise<void>,
        ): void => {
            webSocketHandlers.set(event, callback);
        },
    }),
);

vi.mock(
    '@/api/users/users.queries',
    (): { useMe: () => { data: { id: string } } } => ({
        useMe: (): { data: { id: string } } => ({ data: { id: 'me' } }),
    }),
);

vi.mock('@/hooks/ws/useTypingIndicator', () => ({
    useTypingIndicator: () => ({
        typingUsers: [],
        addTypingUser: vi.fn(),
        hydrateTypingUsers: vi.fn(),
        clearTypingUsers: vi.fn(),
    }),
}));

import type * as ServerQueriesModule from '@/api/servers/servers.queries';

vi.mock('@/api/servers/servers.queries', async (importOriginal) => {
    const actual = await importOriginal<typeof ServerQueriesModule>();
    return {
        ...actual,
        useTypingIndicators: () => ({ data: undefined }),
    };
});

vi.mock('@/ws', () => ({
    WsEvents: {
        MESSAGE_DM: 'message_dm',
        MESSAGE_DM_SENT: 'message_dm_sent',
        MESSAGE_SERVER: 'message_server',
        MESSAGE_SERVER_SENT: 'message_server_sent',
        TYPING_DM: 'typing_dm',
        TYPING_SERVER: 'typing_server',
        MESSAGE_SERVER_DELETED: 'message_server_deleted',
        MESSAGES_SERVER_BULK_DELETED_BY_AUTHOR:
            'messages_server_bulk_deleted_by_author',
        MESSAGE_SERVER_EDITED: 'message_server_edited',
        MESSAGE_SERVER_PIN_UPDATED: 'message_server_pin_updated',
        REACTION_ADDED: 'reaction_added',
        REACTION_REMOVED: 'reaction_removed',
        DM_UNREAD_UPDATED: 'dm_unread_updated',
    },
    wsMessages: {
        joinServer: vi.fn(),
        joinChannel: vi.fn(),
        sendMessageDm: vi.fn(),
        sendMessageServer: vi.fn(),
        sendTypingDm: vi.fn(),
        sendTypingServer: vi.fn(),
    },
}));

describe('useChatWS embeds mapping', (): void => {
    beforeEach((): void => {
        webSocketHandlers.clear();
    });

    it('keeps embeds when mapping server websocket events to chat messages', (): void => {
        const queryClient = new QueryClient();
        const queryKey = CHAT_QUERY_KEYS.channelMessages('s1', 'c1', null);
        queryClient.setQueryData(queryKey, {
            pages: [[]],
            pageParams: [undefined],
        });

        const wrapper = ({
            children,
        }: {
            children: React.ReactNode;
        }): React.JSX.Element => (
            <MemoryRouter>
                <QueryClientProvider client={queryClient}>
                    {children}
                </QueryClientProvider>
            </MemoryRouter>
        );

        renderHook(() => useChatWS(undefined, 's1', 'c1'), { wrapper });

        const handler = webSocketHandlers.get(WsEvents.MESSAGE_SERVER);
        expect(handler).toBeDefined();

        act((): void => {
            void handler?.({
                messageId: 'm1',
                serverId: 's1',
                channelId: 'c1',
                senderId: 'bot1',
                senderUsername: 'helper-bot',
                text: '',
                createdAt: new Date().toISOString(),
                isEdited: false,
                isWebhook: false,
                embeds: [{ title: 'Health Check', description: 'OK' }],
            });
        });

        const cached = queryClient.getQueryData<{
            pages: ChatMessage[][];
            pageParams: unknown[];
        }>(queryKey);

        expect(cached?.pages[0]?.[0]?.embeds).toEqual([
            { title: 'Health Check', description: 'OK' },
        ]);
    });
});

describe('useChatWS bulk delete by author', (): void => {
    beforeEach((): void => {
        webSocketHandlers.clear();
    });

    const wrapperFor = (
        queryClient: QueryClient,
    ): (({
        children,
    }: {
        children: React.ReactNode;
    }) => React.JSX.Element) =>
        function Wrapper({
            children,
        }: {
            children: React.ReactNode;
        }): React.JSX.Element {
            return (
                <MemoryRouter>
                    <QueryClientProvider client={queryClient}>
                        {children}
                    </QueryClientProvider>
                </MemoryRouter>
            );
        };

    const seedMessage = (overrides: Partial<ChatMessage>): ChatMessage =>
        ({
            id: 'm1',
            serverId: 's1',
            channelId: 'c1',
            senderId: 'author1',
            text: 'hi',
            createdAt: new Date().toISOString(),
            isEdited: false,
            isWebhook: false,
            ...overrides,
        }) as ChatMessage;

    it('marks matching messages as deleted across every cached channel in the server', async (): Promise<void> => {
        const queryClient = new QueryClient();
        const channelAKey = CHAT_QUERY_KEYS.channelMessages('s1', 'c1', null);
        const channelBKey = CHAT_QUERY_KEYS.channelMessages('s1', 'c2', null);
        const otherServerKey = CHAT_QUERY_KEYS.channelMessages(
            's2',
            'c3',
            null,
        );

        const matching = seedMessage({
            id: 'm-match',
            channelId: 'c1',
            senderId: 'author1',
            createdAt: new Date(Date.now() - 1000).toISOString(),
        });
        const tooOld = seedMessage({
            id: 'm-old',
            channelId: 'c1',
            senderId: 'author1',
            createdAt: new Date(Date.now() - 100_000).toISOString(),
        });
        const otherAuthor = seedMessage({
            id: 'm-other-author',
            channelId: 'c2',
            senderId: 'author2',
        });
        const matchingInOtherChannel = seedMessage({
            id: 'm-match-2',
            channelId: 'c2',
            senderId: 'author1',
            createdAt: new Date(Date.now() - 500).toISOString(),
        });
        const otherServerMessage = seedMessage({
            id: 'm-other-server',
            serverId: 's2',
            channelId: 'c3',
            senderId: 'author1',
            createdAt: new Date(Date.now() - 500).toISOString(),
        });

        queryClient.setQueryData(channelAKey, {
            pages: [[matching, tooOld]],
            pageParams: [undefined],
        });
        queryClient.setQueryData(channelBKey, {
            pages: [[otherAuthor, matchingInOtherChannel]],
            pageParams: [undefined],
        });
        queryClient.setQueryData(otherServerKey, {
            pages: [[otherServerMessage]],
            pageParams: [undefined],
        });

        renderHook(() => useChatWS(undefined, 's1', 'c1'), {
            wrapper: wrapperFor(queryClient),
        });

        const handler = webSocketHandlers.get(
            WsEvents.MESSAGES_SERVER_BULK_DELETED_BY_AUTHOR,
        );
        expect(handler).toBeDefined();

        await act(async (): Promise<void> => {
            await handler?.({
                senderId: 'author1',
                serverId: 's1',
                after: new Date(Date.now() - 10_000).toISOString(),
            });
        });

        const channelAData = queryClient.getQueryData<{
            pages: ChatMessage[][];
        }>(channelAKey);
        const channelBData = queryClient.getQueryData<{
            pages: ChatMessage[][];
        }>(channelBKey);
        const otherServerData = queryClient.getQueryData<{
            pages: ChatMessage[][];
        }>(otherServerKey);

        expect(channelAData?.pages[0]?.[0]?.deletedAt).toBeDefined();
        expect(channelAData?.pages[0]?.[1]?.deletedAt).toBeUndefined();
        expect(channelBData?.pages[0]?.[0]?.deletedAt).toBeUndefined();
        expect(channelBData?.pages[0]?.[1]?.deletedAt).toBeDefined();
        expect(otherServerData?.pages[0]?.[0]?.deletedAt).toBeUndefined();
    });

    it('cancels in-flight queries before applying the optimistic update so a stale refetch cannot overwrite it', async (): Promise<void> => {
        const queryClient = new QueryClient();
        const channelKey = CHAT_QUERY_KEYS.channelMessages('s1', 'c1', null);
        queryClient.setQueryData(channelKey, {
            pages: [[seedMessage({ senderId: 'author1' })]],
            pageParams: [undefined],
        });

        const cancelSpy = vi.spyOn(queryClient, 'cancelQueries');
        const setQueriesDataSpy = vi.spyOn(queryClient, 'setQueriesData');

        renderHook(() => useChatWS(undefined, 's1', 'c1'), {
            wrapper: wrapperFor(queryClient),
        });

        const handler = webSocketHandlers.get(
            WsEvents.MESSAGES_SERVER_BULK_DELETED_BY_AUTHOR,
        );

        let resolveCancel: () => void = () => {};
        const cancelPromise = new Promise<void>((resolve) => {
            resolveCancel = resolve;
        });
        cancelSpy.mockImplementation(() => cancelPromise as Promise<void>);

        let handlerPromise: Promise<void> | undefined;
        await act(async (): Promise<void> => {
            handlerPromise = handler?.({
                senderId: 'author1',
                serverId: 's1',
                after: new Date(Date.now() - 10_000).toISOString(),
            }) as Promise<void> | undefined;
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(cancelSpy).toHaveBeenCalled();
        expect(setQueriesDataSpy).not.toHaveBeenCalled();

        await act(async (): Promise<void> => {
            resolveCancel();
            await handlerPromise;
        });

        expect(setQueriesDataSpy).toHaveBeenCalled();
    });
});
