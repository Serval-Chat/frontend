import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { ChatMessage } from '@/api/chat/chat.types';
import type { User } from '@/api/users/users.types';
import { useProcessedMessages } from '@/features/chat/hooks/useProcessedMessages';

afterEach((): void => {
    vi.useRealTimers();
});

describe('useProcessedMessages', (): void => {
    it('preserves embeds through processed message mapping', (): void => {
        const message: ChatMessage = {
            id: 'm1',
            text: '',
            createdAt: new Date().toISOString(),
            senderId: 'u1',
            serverId: 's1',
            channelId: 'c1',
            embeds: [{ title: 'Server status', description: 'All green' }],
            attachments: [],
            interaction: null,
            isEdited: false,
            isPinned: false,
            isSticky: false,
            isWebhook: false,
            poll: null,
            reactions: [],
            stickerId: null,
            senderIsBot: false,
        };
        const user: User = { id: 'u1', username: 'bot' } as User;

        const { result } = renderHook(() =>
            useProcessedMessages(
                { pages: [[message]] },
                undefined,
                undefined,
                null,
                's1',
                new Map([['u1', user]]),
                new Map(),
                new Map(),
            ),
        );

        expect(result.current).toHaveLength(1);
        expect(result.current[0]?.embeds).toEqual(message.embeds);
    });

    it('hides expired deleted messages from the active server view', (): void => {
        const message: ChatMessage = {
            id: 'deleted',
            text: 'deleted text',
            createdAt: new Date().toISOString(),
            deletedAt: new Date(Date.now() - 6 * 60_000).toISOString(),
            senderId: 'u1',
            serverId: 's1',
            channelId: 'c1',
            stickerId: null,
            isEdited: false,
            isPinned: false,
            isSticky: false,
            isWebhook: false,
            embeds: [],
            attachments: [],
            interaction: null,
            poll: null,
            reactions: [],
            senderIsBot: false,
        };

        const { result } = renderHook(() =>
            useProcessedMessages(
                { pages: [[message]] },
                undefined,
                undefined,
                null,
                's1',
                new Map(),
                new Map(),
                new Map(),
                5,
            ),
        );

        expect(result.current).toHaveLength(0);
    });

    it('removes a cached deleted message when its configured window expires', async (): Promise<void> => {
        vi.useFakeTimers();
        const now = new Date('2026-11-02T12:00:00.000Z');
        vi.setSystemTime(now);
        const message: ChatMessage = {
            id: 'deleted',
            text: 'deleted text',
            createdAt: now.toISOString(),
            deletedAt: new Date(now.getTime() - 4 * 60_000).toISOString(),
            senderId: 'u1',
            serverId: 's1',
            channelId: 'c1',
            stickerId: null,
            isEdited: false,
            isPinned: false,
            isSticky: false,
            isWebhook: false,
            embeds: [],
            attachments: [],
            interaction: null,
            poll: null,
            reactions: [],
            senderIsBot: false,
        };
        const { result } = renderHook(() =>
            useProcessedMessages(
                { pages: [[message]] },
                undefined,
                undefined,
                null,
                's1',
                new Map(),
                new Map(),
                new Map(),
                5,
            ),
        );

        expect(result.current).toHaveLength(1);
        await act(async (): Promise<void> => {
            await vi.advanceTimersByTimeAsync(60_001);
        });
        expect(result.current).toHaveLength(0);
    });
});
