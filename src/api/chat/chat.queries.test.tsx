import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useChannelMessages, useUserMessages } from '@/api/chat/chat.queries';
import type { ChatMessage } from '@/api/chat/chat.types';

import { chatApi } from './chat.api';

vi.mock('./chat.api', () => ({
    chatApi: {
        getChannelMessages: vi.fn(),
        getDmChannelMessages: vi.fn(),
    },
}));

vi.mock('@/api/channels/channels.queries', () => ({
    useDmChannel: (recipientId: string | null) => ({
        data: recipientId ? { id: `dm-${recipientId}` } : undefined,
    }),
}));

const msg = (id: string, createdAt: string): ChatMessage =>
    ({ id, createdAt, channelId: 'ch-1', senderId: 'u1' }) as ChatMessage;

const liveMessages = [
    msg('msg-1', '2026-01-01T00:00:01.000Z'),
    msg('msg-5', '2026-01-01T00:00:05.000Z'),
    msg('msg-10', '2026-01-01T00:00:10.000Z'),
];

const makeWrapper = (): React.FC<{ children: React.ReactNode }> => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    const Wrapper = ({
        children,
    }: {
        children: React.ReactNode;
    }): React.ReactElement =>
        React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children,
        );
    Wrapper.displayName = 'QueryClientWrapper';
    return Wrapper;
};

describe('useChannelMessages', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
    });

    it('keeps showing already-loaded messages while jumping to one of them, instead of clearing to nothing', async (): Promise<void> => {
        vi.mocked(chatApi.getChannelMessages).mockResolvedValueOnce(
            liveMessages,
        );
        const wrapper = makeWrapper();

        const { result, rerender } = renderHook(
            ({ around }: { around: string | null }) =>
                useChannelMessages('srv-1', 'ch-1', around),
            { wrapper, initialProps: { around: null as string | null } },
        );

        await waitFor((): void => {
            expect(result.current.data?.pages[0]).toEqual(liveMessages);
        });

        let resolveAroundFetch: ((v: ChatMessage[]) => void) | undefined;
        vi.mocked(chatApi.getChannelMessages).mockReturnValueOnce(
            new Promise((resolve) => {
                resolveAroundFetch = resolve;
            }),
        );
        rerender({ around: 'msg-5' });

        expect(result.current.data?.pages[0]).toEqual(liveMessages);
        expect(result.current.isPlaceholderData).toBe(true);

        resolveAroundFetch?.([liveMessages[0]!, liveMessages[1]!]);
        await waitFor((): void => {
            expect(result.current.isPlaceholderData).toBe(false);
        });
        expect(result.current.data?.pages[0]).toEqual([
            liveMessages[0],
            liveMessages[1],
        ]);
    });

    it('does not leak the previous channel messages into a freshly switched channel', async (): Promise<void> => {
        vi.mocked(chatApi.getChannelMessages).mockResolvedValueOnce(
            liveMessages,
        );
        const wrapper = makeWrapper();

        const { result, rerender } = renderHook(
            ({ channelId }: { channelId: string }) =>
                useChannelMessages('srv-1', channelId, null),
            { wrapper, initialProps: { channelId: 'ch-1' } },
        );

        await waitFor((): void => {
            expect(result.current.data?.pages[0]).toEqual(liveMessages);
        });

        vi.mocked(chatApi.getChannelMessages).mockReturnValueOnce(
            new Promise(() => {
            }),
        );
        rerender({ channelId: 'ch-2' });

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });
});

describe('useUserMessages', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
    });

    it('keeps showing already-loaded messages while jumping to one of them, instead of clearing to nothing', async (): Promise<void> => {
        vi.mocked(chatApi.getDmChannelMessages).mockResolvedValueOnce(
            liveMessages,
        );
        const wrapper = makeWrapper();

        const { result, rerender } = renderHook(
            ({ around }: { around: string | null }) =>
                useUserMessages('friend-1', around),
            { wrapper, initialProps: { around: null as string | null } },
        );

        await waitFor((): void => {
            expect(result.current.data?.pages[0]).toEqual(liveMessages);
        });

        let resolveAroundFetch: ((v: ChatMessage[]) => void) | undefined;
        vi.mocked(chatApi.getDmChannelMessages).mockReturnValueOnce(
            new Promise((resolve) => {
                resolveAroundFetch = resolve;
            }),
        );
        rerender({ around: 'msg-5' });

        expect(result.current.data?.pages[0]).toEqual(liveMessages);
        expect(result.current.isPlaceholderData).toBe(true);

        resolveAroundFetch?.([liveMessages[0]!, liveMessages[1]!]);
        await waitFor((): void => {
            expect(result.current.isPlaceholderData).toBe(false);
        });
    });

    it('does not leak the previous friend messages into a freshly switched DM', async (): Promise<void> => {
        vi.mocked(chatApi.getDmChannelMessages).mockResolvedValueOnce(
            liveMessages,
        );
        const wrapper = makeWrapper();

        const { result, rerender } = renderHook(
            ({ friendId }: { friendId: string }) =>
                useUserMessages(friendId, null),
            { wrapper, initialProps: { friendId: 'friend-1' } },
        );

        await waitFor((): void => {
            expect(result.current.data?.pages[0]).toEqual(liveMessages);
        });

        vi.mocked(chatApi.getDmChannelMessages).mockReturnValueOnce(
            new Promise(() => {
            }),
        );
        rerender({ friendId: 'friend-2' });

        expect(result.current.data).toBeUndefined();
        expect(result.current.isLoading).toBe(true);
    });
});
