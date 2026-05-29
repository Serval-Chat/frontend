import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import type { ChatMessage } from '@/api/chat/chat.types';
import type { User } from '@/api/users/users.types';
import { useProcessedMessages } from '@/hooks/chat/useProcessedMessages';

describe('useProcessedMessages', (): void => {
    it('preserves embeds through processed message mapping', (): void => {
        const message: ChatMessage = {
            _id: 'm1',
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
        const user: User = { _id: 'u1', username: 'bot' } as User;

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
});
