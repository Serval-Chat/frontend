import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch } from '@/store/hooks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { MessagesList } from '@/ui/components/chat/MessagesList';

// Mock dependencies
vi.mock('@/store/hooks', () => ({
    useAppDispatch: vi.fn(),
}));

vi.mock('@/store/slices/navSlice', () => ({
    setTargetMessageId: vi.fn((id) => ({
        type: 'nav/setTargetMessageId',
        payload: id,
    })),
}));

vi.mock('@/ui/components/chat/MessageItem', () => ({
    MessageItem: ({
        isHighlighted,
        message,
    }: {
        isHighlighted: boolean;
        message: { _id: string; text: string };
    }) => (
        <div
            data-highlighted={isHighlighted}
            data-testid={`msg-${message._id}`}
        >
            {message.text}
        </div>
    ),
}));

vi.mock('@/ui/components/common/Button', () => ({
    Button: ({
        children,
        onClick,
    }: {
        children: React.ReactNode;
        onClick: () => void;
    }) => <button onClick={onClick}>{children}</button>,
}));

vi.mock('@/ui/components/common/LoadingSpinner', () => ({
    LoadingSpinner: () => <div>Loading...</div>,
}));

vi.mock('@/ui/components/layout/Box', () => ({
    Box: ({
        children,
        className,
        onScroll,
    }: {
        children: React.ReactNode;
        className?: string;
        onScroll?: () => void;
    }) => (
        <div className={className} onScroll={onScroll}>
            {children}
        </div>
    ),
}));

vi.mock('@/ui/components/layout/VerticalSpacer', () => ({
    VerticalSpacer: () => <div />,
}));

describe('MessagesList Highlight Logic', () => {
    const mockDispatch = vi.fn();
    const mockMessages = [
        { _id: '1', text: 'Msg 1' },
        { _id: '2', text: 'Msg 2' },
    ] as unknown as ProcessedChatMessage[];

    beforeEach(() => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        (useAppDispatch as unknown as ReturnType<typeof vi.fn>).mockReturnValue(
            mockDispatch,
        );

        window.HTMLElement.prototype.scrollIntoView = vi.fn();
        window.requestAnimationFrame = vi.fn((cb) => cb());
    });

    it('clears highlight and dispatches null after timeout', async () => {
        let renderer: ReturnType<typeof render> | undefined;
        act(() => {
            renderer = render(
                <MessagesList
                    activeHighlightId="2"
                    hasMore={false}
                    messages={mockMessages}
                />,
            );
        });

        const { getByTestId, rerender } = renderer!;

        const msg2 = getByTestId('msg-2');
        expect(msg2.getAttribute('data-highlighted')).toBe('true');

        act(() => {
            vi.advanceTimersByTime(2000);
        });

        expect(msg2.getAttribute('data-highlighted')).toBe('false');

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'nav/setTargetMessageId',
                payload: null,
            }),
        );

        act(() => {
            rerender(
                <MessagesList
                    activeHighlightId={null}
                    hasMore={false}
                    messages={mockMessages}
                />,
            );
        });

        expect(msg2.getAttribute('data-highlighted')).toBe('false');
    });

    it('does not re-highlight on re-render if messages change but activeHighlightId is the same', async () => {
        let renderer: ReturnType<typeof render> | undefined;
        act(() => {
            renderer = render(
                <MessagesList
                    activeHighlightId="2"
                    hasMore={false}
                    messages={mockMessages}
                />,
            );
        });

        const { getByTestId, rerender } = renderer!;
        expect(getByTestId('msg-2').getAttribute('data-highlighted')).toBe(
            'true',
        );

        act(() => {
            vi.advanceTimersByTime(1000);
        });
        expect(getByTestId('msg-2').getAttribute('data-highlighted')).toBe(
            'true',
        );
        const newMessages = [
            ...mockMessages,
            { _id: '3', text: 'Msg 3' } as unknown as ProcessedChatMessage,
        ];
        act(() => {
            rerender(
                <MessagesList
                    activeHighlightId="2"
                    hasMore={false}
                    messages={newMessages}
                />,
            );
        });

        expect(getByTestId('msg-2').getAttribute('data-highlighted')).toBe(
            'true',
        );

        act(() => {
            vi.advanceTimersByTime(1000);
        });

        expect(getByTestId('msg-2').getAttribute('data-highlighted')).toBe(
            'false',
        );
    });

    it('clears highlight and dispatches null on unmount if timer was active', () => {
        let renderer: ReturnType<typeof render> | undefined;
        act(() => {
            renderer = render(
                <MessagesList
                    activeHighlightId="2"
                    hasMore={false}
                    messages={mockMessages}
                />,
            );
        });

        const { unmount } = renderer!;

        act(() => {
            unmount();
        });
        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'nav/setTargetMessageId',
                payload: null,
            }),
        );
    });
});
