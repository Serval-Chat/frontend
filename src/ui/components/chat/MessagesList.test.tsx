import { useVirtualizer } from '@tanstack/react-virtual';
import { fireEvent, render } from '@testing-library/react';
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
        globalThis.requestAnimationFrame =
            requestAnimationFrameMock as any as typeof globalThis.requestAnimationFrame;
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

    it('centers the target on its real geometry when jumping', (): void => {
        // container is 600 tall, target row 400px below the top -> must scroll
        // +150 to centre it. Row position tracks scrollTop so the settle loop
        // converges instead of overshooting.
        const clientHeightSpy = vi
            .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
            .mockReturnValue(600);
        const rectSpy = vi
            .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function (this: HTMLElement): DOMRect {
                if (this.classList.contains('custom-scrollbar')) {
                    return { top: 0, height: 600 } as DOMRect;
                }
                if (this.getAttribute('data-index') === '1') {
                    const scroller = this.closest(
                        '.custom-scrollbar',
                    ) as HTMLElement | null;
                    const scrollTop = scroller?.scrollTop ?? 0;
                    return { top: 400 - scrollTop, height: 100 } as DOMRect;
                }
                return { top: 0, height: 0 } as DOMRect;
            });

        const { container } = render(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={mockMessages}
            />,
        );

        const scroller = container.querySelector(
            '.custom-scrollbar',
        ) as HTMLElement;
        // delta = 400 - 0 - (600 - 100) / 2 = 150
        expect(scroller.scrollTop).toBe(150);

        rectSpy.mockRestore();
        clientHeightSpy.mockRestore();
    });

    it('centers on the target of a second consecutive jump', (): void => {
        // regression: the second jump used to be misread as a prepend (because
        // the "entered highlight" edge was consumed on a stale render), leaving
        // the viewport off the target. The active target row is always data-
        // index 1 and must land centered (+150) on both jumps, even though the
        // window's first message changes between them.
        const clientHeightSpy = vi
            .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
            .mockReturnValue(600);
        const rectSpy = vi
            .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function (this: HTMLElement): DOMRect {
                if (this.classList.contains('custom-scrollbar')) {
                    return { top: 0, height: 600 } as DOMRect;
                }
                if (this.getAttribute('data-index') === '1') {
                    const scroller = this.closest(
                        '.custom-scrollbar',
                    ) as HTMLElement | null;
                    const scrollTop = scroller?.scrollTop ?? 0;
                    return { top: 400 - scrollTop, height: 100 } as DOMRect;
                }
                return { top: 0, height: 0 } as DOMRect;
            });

        const base = mockMessages[0]!;
        const windowA = [
            { ...base, id: 'a-1' },
            { ...base, id: 'a-2' },
        ];
        // a different window whose first message differs from windowA's, so the
        // pre-fix code would treat the swap as a prepend.
        const windowB = [
            { ...base, id: 'b-0' },
            { ...base, id: 'b-1' },
            { ...base, id: 'b-2' },
        ];

        const { container, rerender } = render(
            <MessagesList
                activeHighlightId="a-2"
                hasMore={false}
                messages={windowA}
            />,
        );
        const scroller = (): HTMLElement =>
            container.querySelector('.custom-scrollbar') as HTMLElement;
        expect(scroller().scrollTop).toBe(150);

        // second jump: fresh window, new target (also at index 1).
        scroller().scrollTop = 0;
        rerender(
            <MessagesList
                activeHighlightId="b-1"
                hasMore={false}
                messages={windowB}
            />,
        );
        expect(scroller().scrollTop).toBe(150);

        rectSpy.mockRestore();
        clientHeightSpy.mockRestore();
    });

    it('anchors a fresh (non-target) message list to the newest message on open', (): void => {
        // [msg-1, msg-2, spacer] -> last index is 2
        render(<MessagesList hasMore={false} messages={mockMessages} />);

        const options = vi.mocked(useVirtualizer).mock.calls[0]![0] as {
            initialOffset: () => number;
        };

        // initialOffset gives the first frame a bottom bias...
        expect(options.initialOffset()).toBe(Number.MAX_SAFE_INTEGER);
        // ...and we explicitly anchor to the newest message before paint so
        // dynamic row heights can't leave us scrolled up in older messages.
        expect(mockScrollToIndex).toHaveBeenCalledWith(2, { align: 'end' });
    });

    it('starts targeted message lists at the top so highlight scrolling can center the target', (): void => {
        render(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={mockMessages}
            />,
        );

        const options = vi.mocked(useVirtualizer).mock.calls[0]![0] as {
            initialOffset: () => number;
        };

        expect(options.initialOffset()).toBe(0);
        // a targeted list must never anchor itself to the newest message.
        expect(mockScrollToIndex).not.toHaveBeenCalledWith(2, { align: 'end' });
    });

    it('does not act until the target message is in the loaded window', (): void => {
        const clientHeightSpy = vi
            .spyOn(HTMLElement.prototype, 'clientHeight', 'get')
            .mockReturnValue(600);
        const rectSpy = vi
            .spyOn(HTMLElement.prototype, 'getBoundingClientRect')
            .mockImplementation(function (this: HTMLElement): DOMRect {
                if (this.classList.contains('custom-scrollbar')) {
                    return { top: 0, height: 600 } as DOMRect;
                }
                if (this.getAttribute('data-index') === '1') {
                    const scroller = this.closest(
                        '.custom-scrollbar',
                    ) as HTMLElement | null;
                    const scrollTop = scroller?.scrollTop ?? 0;
                    return { top: 400 - scrollTop, height: 100 } as DOMRect;
                }
                return { top: 0, height: 0 } as DOMRect;
            });

        const { container, rerender } = render(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={[]}
            />,
        );

        const scroller = (): HTMLElement =>
            container.querySelector('.custom-scrollbar') as HTMLElement;
        // target absent -> no scroll happens yet.
        expect(scroller().scrollTop).toBe(0);

        rerender(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={mockMessages}
            />,
        );

        // target now present -> centered.
        expect(scroller().scrollTop).toBe(150);

        // re-render with the same target must not re-run the jump.
        scroller().scrollTop = 999;
        rerender(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={[...mockMessages, { ...mockMessages[0]!, id: 'msg-3' }]}
            />,
        );
        expect(scroller().scrollTop).toBe(999);

        rectSpy.mockRestore();
        clientHeightSpy.mockRestore();
    });

    it('remeasures virtual rows when a message reports an async resize', (): void => {
        const { getAllByText } = render(
            <MessagesList hasMore={false} messages={mockMessages} />,
        );

        getAllByText('resize')[0]!.click();

        expect(requestAnimationFrameMock).toHaveBeenCalled();
    });

    it('does not re-pin to the bottom when jumping to a message from the bottom', (): void => {
        const onAtBottomChange = vi.fn();

        const { rerender, getAllByText } = render(
            <MessagesList
                hasMore={false}
                messages={mockMessages}
                onAtBottomChange={onAtBottomChange}
            />,
        );

        // the initial (non-target) open legitimately anchors to the bottom;
        // only the jump that follows must not.
        mockScrollToIndex.mockClear();

        rerender(
            <MessagesList
                activeHighlightId="msg-1"
                hasMore={false}
                messages={mockMessages}
                onAtBottomChange={onAtBottomChange}
            />,
        );

        expect(onAtBottomChange).toHaveBeenLastCalledWith(false);
        // the jump must not anchor the viewport to the newest message.
        expect(mockScrollToIndex).not.toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ align: 'end' }),
        );

        // a late measurement pass (e.g. an image/embed finishing loading) must
        // not drag the viewport back down to the bottom - this is the jitter
        // the jump-to-message fix guards against.
        mockScrollToIndex.mockClear();
        getAllByText('resize')[0]!.click();
        expect(mockScrollToIndex).not.toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ align: 'end' }),
        );
    });

    it('does not re-pin to the bottom after the user scrolls up', (): void => {
        const onAtBottomChange = vi.fn();
        const { container, getAllByText } = render(
            <MessagesList
                hasMore={false}
                messages={mockMessages}
                onAtBottomChange={onAtBottomChange}
            />,
        );
        const scroller = container.querySelector(
            '.custom-scrollbar',
        ) as HTMLElement;

        // the list is taller than the viewport and the user scrolls well away
        // from the bottom (1000 - 100 - 300 = 600px gap).
        Object.defineProperty(scroller, 'scrollHeight', {
            configurable: true,
            value: 1000,
        });
        Object.defineProperty(scroller, 'clientHeight', {
            configurable: true,
            value: 300,
        });
        scroller.scrollTop = 100;
        fireEvent.scroll(scroller);

        expect(onAtBottomChange).toHaveBeenLastCalledWith(false);

        // a late measurement (image finishing loading) must not yank the
        // viewport back down to the newest messages.
        mockScrollToIndex.mockClear();
        getAllByText('resize')[0]!.click();
        expect(mockScrollToIndex).not.toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ align: 'end' }),
        );
    });

    it('does not follow content to the bottom while a jump target is active', (): void => {
        // the reported bug: after jumping, late-loading embeds grow the window
        // and the auto-follow pins the viewport to the newest message. While a
        // target is active we are in a historical window, so follow must be off.
        const { container, getAllByText } = render(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={mockMessages}
            />,
        );
        const scroller = container.querySelector(
            '.custom-scrollbar',
        ) as HTMLElement;

        // force the "we're at the bottom" state that content-growth produces.
        Object.defineProperty(scroller, 'scrollHeight', {
            configurable: true,
            value: 300,
        });
        Object.defineProperty(scroller, 'clientHeight', {
            configurable: true,
            value: 300,
        });
        scroller.scrollTop = 0; // 300 - 0 - 300 = 0 < 5 => at bottom
        fireEvent.scroll(scroller);

        // a late measurement must NOT pin to the newest message.
        mockScrollToIndex.mockClear();
        getAllByText('resize')[0]!.click();
        expect(mockScrollToIndex).not.toHaveBeenCalledWith(
            expect.anything(),
            expect.objectContaining({ align: 'end' }),
        );
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
            { ...mockMessages[0]!, id: 'msg-3', text: 'New Message' },
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
