import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { CHAT_QUERY_KEYS } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';
import { useChatWS } from '@/hooks/ws/useChatWS';
import { WsEvents } from '@/ws';

const webSocketHandlers = new Map<string, (payload: unknown) => void>();

vi.mock('@/hooks/ws/useWebSocket', () => ({
    useWebSocket: (event: string, callback: (payload: unknown) => void) => {
        webSocketHandlers.set(event, callback);
    },
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: () => ({ data: { _id: 'me' } }),
}));

vi.mock('@/hooks/ws/useTypingIndicator', () => ({
    useTypingIndicator: () => ({
        typingUsers: [],
        addTypingUser: vi.fn(),
        clearTypingUsers: vi.fn(),
    }),
}));

vi.mock('@/ws', () => ({
    WsEvents: {
        MESSAGE_DM: 'message_dm',
        MESSAGE_DM_SENT: 'message_dm_sent',
        MESSAGE_SERVER: 'message_server',
        MESSAGE_SERVER_SENT: 'message_server_sent',
        TYPING_DM: 'typing_dm',
        TYPING_SERVER: 'typing_server',
        MESSAGE_SERVER_DELETED: 'message_server_deleted',
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

describe('useChatWS embeds mapping', () => {
    beforeEach(() => {
        webSocketHandlers.clear();
    });

    it('keeps embeds when mapping server websocket events to chat messages', () => {
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
            <QueryClientProvider client={queryClient}>
                {children}
            </QueryClientProvider>
        );

        renderHook(() => useChatWS(undefined, 's1', 'c1'), { wrapper });

        const handler = webSocketHandlers.get(WsEvents.MESSAGE_SERVER);
        expect(handler).toBeDefined();

        act(() => {
            handler?.({
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
