import { act, render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { MessagesList } from '@/ui/components/chat/MessagesList';

// Mock dependencies
vi.mock('@/store/hooks', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@/store/slices/navSlice', () => ({
    setTargetMessageId: vi.fn((id): { type: string; payload: any } => ({
        type: 'nav/setTargetMessageId',
        payload: id,
    })),
}));

vi.mock('@/ui/components/chat/MessageItem', () => ({
    MessageItem: ({
        message,
        isHighlighted,
    }: {
        message: { id: string; text: string };
        isHighlighted?: boolean;
    }) => (
        <div
            data-highlighted={!!isHighlighted}
            data-testid={`msg-${message.id}`}
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
        scrollToIndex: vi.fn(),
        measureElement: vi.fn(),
    })),
}));

describe('MessagesList Highlight Logic', (): void => {
    const mockDispatch = vi.fn();
    const mockMessages = [
        { id: '1', text: 'Msg 1' },
        { id: '2', text: 'Msg 2' },
    ] as any as ProcessedChatMessage[];

    beforeEach((): void => {
        vi.useFakeTimers();
        vi.clearAllMocks();
        vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);
        vi.mocked(useAppSelector).mockReturnValue({}); // default blocks

        window.HTMLElement.prototype.scrollIntoView = vi.fn();
        window.requestAnimationFrame = vi.fn((cb) => cb());
    });

    it('clears highlight and dispatches null after timeout', async (): Promise<void> => {
        let renderer: ReturnType<typeof render> | undefined;
        act((): void => {
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

        act((): void => {
            vi.advanceTimersByTime(2000);
        });

        expect(msg2.getAttribute('data-highlighted')).toBe('false');

        expect(mockDispatch).toHaveBeenCalledWith(
            expect.objectContaining({
                type: 'nav/setTargetMessageId',
                payload: null,
            }),
        );

        act((): void => {
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

    it('does not re-highlight on re-render if messages change but activeHighlightId is the same', async (): Promise<void> => {
        let renderer: ReturnType<typeof render> | undefined;
        act((): void => {
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

        act((): void => {
            vi.advanceTimersByTime(1000);
        });
        expect(getByTestId('msg-2').getAttribute('data-highlighted')).toBe(
            'true',
        );
        const newMessages = [
            ...mockMessages,
            { id: '3', text: 'Msg 3' } as any as ProcessedChatMessage,
        ];
        act((): void => {
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

        act((): void => {
            vi.advanceTimersByTime(1000);
        });

        expect(getByTestId('msg-2').getAttribute('data-highlighted')).toBe(
            'false',
        );
    });

    it('clears highlight and dispatches null on unmount if timer was active', (): void => {
        let renderer: ReturnType<typeof render> | undefined;
        act((): void => {
            renderer = render(
                <MessagesList
                    activeHighlightId="2"
                    hasMore={false}
                    messages={mockMessages}
                />,
            );
        });

        const { unmount } = renderer!;

        act((): void => {
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
