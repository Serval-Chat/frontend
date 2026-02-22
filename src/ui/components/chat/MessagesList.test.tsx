import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { ProcessedChatMessage } from '@/types/chat.ui';
import { MessagesList } from '@/ui/components/chat/MessagesList';

// Mock MessageItem so we don't have to render its entire tree
vi.mock('@/ui/components/chat/MessageItem', () => ({
    MessageItem: ({
        message,
        isHighlighted,
    }: {
        message: ProcessedChatMessage;
        isHighlighted: boolean;
    }) => (
        <div
            data-highlighted={isHighlighted}
            data-testid={`message-${message._id}`}
            id={`message-${message._id}`}
        >
            {message.text}
        </div>
    ),
}));

describe('MessagesList Scroll Behavior', () => {
    let scrollIntoViewMock: ReturnType<typeof vi.fn>;
    let requestAnimationFrameMock: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        scrollIntoViewMock = vi.fn();
        window.HTMLElement.prototype.scrollIntoView =
            scrollIntoViewMock as unknown as typeof window.HTMLElement.prototype.scrollIntoView;

        requestAnimationFrameMock = vi.fn((cb) => cb());
        window.requestAnimationFrame =
            requestAnimationFrameMock as unknown as typeof window.requestAnimationFrame;
    });

    const mockMessages: ProcessedChatMessage[] = [
        {
            _id: 'msg-1',
            text: 'Hello',
            channelId: 'ch-1',
            serverId: 'srv-1',
            senderId: 'usr-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isEdited: false,
            readBy: [],
            user: {
                _id: 'usr-1',
                username: 'User 1',
                email: 'user1@test.com',
                status: 'online',
            },
        } as unknown as ProcessedChatMessage,
        {
            _id: 'msg-2',
            text: 'World',
            channelId: 'ch-1',
            serverId: 'srv-1',
            senderId: 'usr-2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isEdited: false,
            readBy: [],
            user: {
                _id: 'usr-2',
                username: 'User 2',
                email: 'user2@test.com',
                status: 'online',
            },
        } as unknown as ProcessedChatMessage,
    ];

    it('scrolls to message immediately if element is in the DOM', () => {
        render(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={mockMessages}
            />,
        );

        // Expect it to have scrolled into view since it rendered with the message
        expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
        expect(scrollIntoViewMock).toHaveBeenCalledWith({
            behavior: 'smooth',
            block: 'center',
        });
    });

    it('waits for the message to render before scrolling and only scrolls once', () => {
        const { rerender } = render(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={[]}
            />,
        );

        expect(scrollIntoViewMock).not.toHaveBeenCalled();

        rerender(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={mockMessages}
            />,
        );

        expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);

        const newMessages = [
            ...mockMessages,
            { ...mockMessages[0], _id: 'msg-3' },
        ];
        rerender(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={newMessages}
            />,
        );

        expect(scrollIntoViewMock).toHaveBeenCalledTimes(1);
    });
});
