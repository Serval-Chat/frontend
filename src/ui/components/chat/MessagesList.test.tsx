import { useVirtualizer } from '@tanstack/react-virtual';
import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { MessagesList } from '@/ui/components/chat/MessagesList';

vi.mock('@/store/hooks', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

// Mock MessageItem so we don't have to render its entire tree
vi.mock('@/ui/components/chat/MessageItem', () => ({
    MessageItem: ({
        message,
        isHighlighted,
        onResize,
    }: {
        message: ProcessedChatMessage;
        isHighlighted: boolean;
        onResize?: () => void;
    }) => (
        <div
            data-highlighted={isHighlighted}
            data-testid={`message-${message.id}`}
            id={`message-${message.id}`}
        >
            {message.text}
            <button type="button" onClick={onResize}>
                resize
            </button>
        </div>
    ),
}));

const mockScrollToIndex = vi.fn();
const mockMeasure = vi.fn();

vi.mock('@tanstack/react-virtual', () => ({
    useVirtualizer: vi.fn().mockImplementation((options: any) => ({
        getVirtualItems: (): { index: number; start: number; key: number }[] =>
            Array.from({ length: options.count }).map(
                (_, i): { index: number; start: number; key: number } => ({
                    index: i,
                    start: 0,
                    key: i,
                }),
            ),
        getTotalSize: (): number => options.count * 100,
        scrollToIndex: mockScrollToIndex,
        measure: mockMeasure,
        measureElement: vi.fn(),
    })),
}));

describe('MessagesList Scroll Behavior', (): void => {
    let requestAnimationFrameMock: ReturnType<typeof vi.fn>;

    const mockDispatch = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();
        mockScrollToIndex.mockClear();
        mockMeasure.mockClear();
        vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);
        vi.mocked(useAppSelector).mockReturnValue({}); // default blocks

        requestAnimationFrameMock = vi.fn((cb) => cb());
        window.requestAnimationFrame =
            requestAnimationFrameMock as any as typeof window.requestAnimationFrame;
    });

    const mockMessages: ProcessedChatMessage[] = [
        {
            id: 'msg-1',
            text: 'Hello',
            channelId: 'ch-1',
            serverId: 'srv-1',
            senderId: 'usr-1',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isEdited: false,
            readBy: [],
            user: {
                id: 'usr-1',
                username: 'User 1',
                email: 'user1@test.com',
                status: 'online',
            },
        } as any as ProcessedChatMessage,
        {
            id: 'msg-2',
            text: 'World',
            channelId: 'ch-1',
            serverId: 'srv-1',
            senderId: 'usr-2',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            isEdited: false,
            readBy: [],
            user: {
                id: 'usr-2',
                username: 'User 2',
                email: 'user2@test.com',
                status: 'online',
            },
        } as any as ProcessedChatMessage,
    ];

    it('scrolls to message immediately if element is in the DOM', (): void => {
        render(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={mockMessages}
            />,
        );

        expect(mockScrollToIndex).toHaveBeenCalledWith(1, { align: 'center' });
    });

    it('starts cached message lists at the bottom without a corrective scroll', (): void => {
        render(<MessagesList hasMore={false} messages={mockMessages} />);

        const options = vi.mocked(useVirtualizer).mock.calls[0][0] as {
            initialOffset: () => number;
        };

        expect(options.initialOffset()).toBe(Number.MAX_SAFE_INTEGER);
        expect(mockScrollToIndex).not.toHaveBeenCalledWith(2, {
            align: 'end',
        });
    });

    it('starts targeted message lists at the top so highlight scrolling can center the target', (): void => {
        render(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={mockMessages}
            />,
        );

        const options = vi.mocked(useVirtualizer).mock.calls[0][0] as {
            initialOffset: () => number;
        };

        expect(options.initialOffset()).toBe(0);
        expect(mockScrollToIndex).toHaveBeenCalledWith(1, { align: 'center' });
    });

    it('waits for the message to render before scrolling and only scrolls once', (): void => {
        const { rerender } = render(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={[]}
            />,
        );

        expect(mockScrollToIndex).not.toHaveBeenCalledWith(1, {
            align: 'center',
        });

        rerender(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={mockMessages}
            />,
        );

        expect(mockScrollToIndex).toHaveBeenCalledWith(1, { align: 'center' });

        mockScrollToIndex.mockClear();

        const newMessages = [
            ...mockMessages,
            { ...mockMessages[0], id: 'msg-3' },
        ];
        rerender(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={newMessages}
            />,
        );

        expect(mockScrollToIndex).not.toHaveBeenCalledWith(1, {
            align: 'center',
        });
    });

    it('remeasures virtual rows when a message reports an async resize', (): void => {
        const { getAllByText } = render(
            <MessagesList hasMore={false} messages={mockMessages} />,
        );

        getAllByText('resize')[0].click();

        expect(requestAnimationFrameMock).toHaveBeenCalled();
    });

    it('loads older messages if scroll is near top and someone sends a message', (): void => {
        const handleLoadMore = vi.fn();
        const { rerender } = render(
            <MessagesList
                hasMore
                messages={mockMessages}
                onLoadMore={handleLoadMore}
            />,
        );
        const newMessages = [
            ...mockMessages,
            { ...mockMessages[0], id: 'msg-3', text: 'New Message' },
        ];

        rerender(
            <MessagesList
                hasMore
                messages={newMessages}
                onLoadMore={handleLoadMore}
            />,
        );

        expect(handleLoadMore).toHaveBeenCalled();
    });
});
