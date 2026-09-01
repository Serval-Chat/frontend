import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { MessagesList } from '@/ui/components/chat/MessagesList';

vi.mock('@/store/hooks', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

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
            data-testid={`message-${message.id}`}
            id={`message-${message.id}`}
        >
            {message.text}
        </div>
    ),
}));

const offsetTops = new Map<string, number>();
const offsetHeights = new Map<string, number>();

const resizeCallbacks: ResizeObserverCallback[] = [];
class FakeResizeObserver {
    constructor(cb: ResizeObserverCallback) {
        resizeCallbacks.push(cb);
    }
    observe(): void {}
    unobserve(): void {}
    disconnect(): void {}
}

const triggerResize = (): void => {
    for (const cb of resizeCallbacks) {
        cb([], {} as ResizeObserver);
    }
};

const msg = (id: string, text = id): ProcessedChatMessage =>
    ({
        id,
        text,
        channelId: 'ch-1',
        serverId: 'srv-1',
        senderId: `usr-${id}`,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
        isEdited: false,
        readBy: [],
        user: { id: `usr-${id}`, username: id },
    }) as unknown as ProcessedChatMessage;

const mockMessages = [msg('msg-1', 'Hello'), msg('msg-2', 'World')];

const scroller = (): HTMLElement => screen.getByTestId('messages-scroller');

const setScrollerGeometry = (
    scrollHeight: number,
    clientHeight: number,
): void => {
    const el = scroller();
    Object.defineProperty(el, 'scrollHeight', {
        configurable: true,
        value: scrollHeight,
    });
    Object.defineProperty(el, 'clientHeight', {
        configurable: true,
        value: clientHeight,
    });
};

const scrollTo = (top: number): void => {
    const el = scroller();
    el.scrollTop = top;
    fireEvent.scroll(el);
};

describe('MessagesList', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
        offsetTops.clear();
        offsetHeights.clear();
        resizeCallbacks.length = 0;
        vi.stubGlobal('ResizeObserver', FakeResizeObserver);
        vi.mocked(useAppDispatch).mockReturnValue(vi.fn());
        vi.mocked(useAppSelector).mockReturnValue({});

        Object.defineProperty(HTMLElement.prototype, 'offsetTop', {
            configurable: true,
            get(this: HTMLElement): number {
                return offsetTops.get(this.id) ?? 0;
            },
        });
        Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
            configurable: true,
            get(this: HTMLElement): number {
                return offsetHeights.get(this.id) ?? 0;
            },
        });
    });

    afterEach((): void => {
        vi.unstubAllGlobals();
        for (const prop of ['offsetTop', 'offsetHeight']) {
            delete (
                HTMLElement.prototype as unknown as Record<string, unknown>
            )[prop];
        }
    });

    it('renders every loaded message, with no windowing', (): void => {
        render(<MessagesList hasMore={false} messages={mockMessages} />);

        expect(screen.getByTestId('message-msg-1')).toBeInTheDocument();
        expect(screen.getByTestId('message-msg-2')).toBeInTheDocument();
    });

    it('opens pinned to the newest message', (): void => {
        const { rerender } = render(
            <MessagesList hasMore={false} messages={[]} />,
        );
        setScrollerGeometry(3000, 800);
        rerender(<MessagesList hasMore={false} messages={mockMessages} />);

        expect(scroller().scrollTop).toBe(2200);
        expect(scroller()).toHaveStyle({ opacity: '1' });
    });

    it('does not render the list until a jump target is in the loaded window', (): void => {
        const { rerender } = render(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={[]}
            />,
        );
        expect(screen.queryByTestId('message-msg-2')).toBeNull();

        rerender(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={mockMessages}
            />,
        );
        expect(screen.getByTestId('message-msg-2')).toBeInTheDocument();
    });

    it('centres a jump target instead of pinning to the bottom', (): void => {
        const { rerender } = render(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={[]}
            />,
        );
        setScrollerGeometry(5000, 800);
        offsetTops.set('message-msg-2', 2000);
        offsetHeights.set('message-msg-2', 100);

        rerender(
            <MessagesList
                activeHighlightId="msg-2"
                hasMore={false}
                messages={mockMessages}
            />,
        );

        // offsetTop - clientHeight/2 + height/2
        expect(scroller().scrollTop).toBe(2000 - 400 + 50);
    });

    describe('loading older messages', (): void => {
        const setup = (
            isLoadingMore = false,
        ): { onLoadMore: ReturnType<typeof vi.fn> } => {
            const onLoadMore = vi.fn();
            const { rerender } = render(
                <MessagesList hasMore messages={[]} onLoadMore={onLoadMore} />,
            );
            setScrollerGeometry(5000, 800);
            rerender(
                <MessagesList
                    hasMore
                    isLoadingMore={isLoadingMore}
                    messages={mockMessages}
                    onLoadMore={onLoadMore}
                />,
            );
            return { onLoadMore };
        };

        it('asks for more when the reader nears the top', (): void => {
            const { onLoadMore } = setup();
            scrollTo(100);
            expect(onLoadMore).toHaveBeenCalledTimes(1);
        });

        it('stays quiet while far from the top', (): void => {
            const { onLoadMore } = setup();
            scrollTo(3000);
            expect(onLoadMore).not.toHaveBeenCalled();
        });

        it('does not ask again while a fetch is already in flight', (): void => {
            const { onLoadMore } = setup(true);
            scrollTo(100);
            expect(onLoadMore).not.toHaveBeenCalled();
        });

        it('pauses after a page that barely grew the list, until the reader scrolls away', (): void => {
            const onLoadMore = vi.fn();
            const { rerender } = render(
                <MessagesList hasMore messages={[]} onLoadMore={onLoadMore} />,
            );
            setScrollerGeometry(5000, 800);
            rerender(
                <MessagesList
                    hasMore
                    messages={mockMessages}
                    onLoadMore={onLoadMore}
                />,
            );

            scrollTo(100);
            expect(onLoadMore).toHaveBeenCalledTimes(1);

            // fetch resolves having added almost nothing
            rerender(
                <MessagesList
                    hasMore
                    isLoadingMore
                    messages={mockMessages}
                    onLoadMore={onLoadMore}
                />,
            );
            rerender(
                <MessagesList
                    hasMore
                    messages={[msg('older-1'), ...mockMessages]}
                    onLoadMore={onLoadMore}
                />,
            );

            scrollTo(120);
            expect(onLoadMore).toHaveBeenCalledTimes(1);

            scrollTo(3000);
            scrollTo(100);
            expect(onLoadMore).toHaveBeenCalledTimes(2);
        });
    });

    describe('loading newer messages', (): void => {
        const setup = (
            isLoadingMoreNewer = false,
        ): { onLoadMoreNewer: ReturnType<typeof vi.fn> } => {
            const onLoadMoreNewer = vi.fn();
            const { rerender } = render(
                <MessagesList
                    hasMoreNewer
                    messages={[]}
                    onLoadMoreNewer={onLoadMoreNewer}
                />,
            );
            setScrollerGeometry(5000, 800);
            rerender(
                <MessagesList
                    hasMoreNewer
                    isLoadingMoreNewer={isLoadingMoreNewer}
                    messages={mockMessages}
                    onLoadMoreNewer={onLoadMoreNewer}
                />,
            );
            return { onLoadMoreNewer };
        };

        it('asks for more when the reader nears the bottom', (): void => {
            const { onLoadMoreNewer } = setup();
            // maxScrollTop = 5000 - 800 = 4200;
            scrollTo(3800);
            expect(onLoadMoreNewer).toHaveBeenCalledTimes(1);
        });

        it('stays quiet while far from the bottom', (): void => {
            const { onLoadMoreNewer } = setup();
            scrollTo(100);
            expect(onLoadMoreNewer).not.toHaveBeenCalled();
        });

        it('does not ask again while a fetch is already in flight', (): void => {
            const { onLoadMoreNewer } = setup(true);
            scrollTo(3800);
            expect(onLoadMoreNewer).not.toHaveBeenCalled();
        });

        it('pauses after a page that barely grew the list, until the reader scrolls away', (): void => {
            const onLoadMoreNewer = vi.fn();
            const { rerender } = render(
                <MessagesList
                    hasMoreNewer
                    messages={[]}
                    onLoadMoreNewer={onLoadMoreNewer}
                />,
            );
            setScrollerGeometry(5000, 800);
            rerender(
                <MessagesList
                    hasMoreNewer
                    messages={mockMessages}
                    onLoadMoreNewer={onLoadMoreNewer}
                />,
            );

            scrollTo(3800);
            expect(onLoadMoreNewer).toHaveBeenCalledTimes(1);

            // fetch resolves having added almost nothing
            rerender(
                <MessagesList
                    hasMoreNewer
                    isLoadingMoreNewer
                    messages={mockMessages}
                    onLoadMoreNewer={onLoadMoreNewer}
                />,
            );
            rerender(
                <MessagesList
                    hasMoreNewer
                    messages={[...mockMessages, msg('newer-1')]}
                    onLoadMoreNewer={onLoadMoreNewer}
                />,
            );

            scrollTo(3820);
            expect(onLoadMoreNewer).toHaveBeenCalledTimes(1);

            scrollTo(100);
            scrollTo(3800);
            expect(onLoadMoreNewer).toHaveBeenCalledTimes(2);
        });

        it('does not interfere with loading older messages at the top', (): void => {
            const onLoadMore = vi.fn();
            const onLoadMoreNewer = vi.fn();
            const { rerender } = render(
                <MessagesList
                    hasMore
                    hasMoreNewer
                    messages={[]}
                    onLoadMore={onLoadMore}
                    onLoadMoreNewer={onLoadMoreNewer}
                />,
            );
            setScrollerGeometry(5000, 800);
            rerender(
                <MessagesList
                    hasMore
                    hasMoreNewer
                    messages={mockMessages}
                    onLoadMore={onLoadMore}
                    onLoadMoreNewer={onLoadMoreNewer}
                />,
            );

            scrollTo(100);
            expect(onLoadMore).toHaveBeenCalledTimes(1);
            expect(onLoadMoreNewer).not.toHaveBeenCalled();
        });
    });

    describe('holding position', (): void => {
        type Rerender = (ui: React.ReactElement) => void;

        const setupScrolledUp = (): Rerender => {
            const { rerender } = render(<MessagesList hasMore messages={[]} />);
            setScrollerGeometry(5000, 800);
            offsetTops.set('message-msg-1', 1000);
            offsetTops.set('message-msg-2', 1200);
            rerender(<MessagesList hasMore messages={mockMessages} />);
            scrollTo(1000);
            return rerender;
        };

        it('keeps the anchored message still when older messages are prepended above it', (): void => {
            const rerender = setupScrolledUp();
            expect(scroller().scrollTop).toBe(1000);

            offsetTops.set('message-msg-1', 1600);
            offsetTops.set('message-msg-2', 1800);
            setScrollerGeometry(5600, 800);

            rerender(
                <MessagesList
                    hasMore
                    messages={[msg('older-1'), ...mockMessages]}
                />,
            );

            expect(scroller().scrollTop).toBe(1600);
        });

        it('re-asserts the anchor when media above the reader loads and resizes', (): void => {
            setupScrolledUp();
            expect(scroller().scrollTop).toBe(1000);

            offsetTops.set('message-msg-1', 1150);
            offsetTops.set('message-msg-2', 1350);

            act((): void => {
                triggerResize();
            });

            expect(scroller().scrollTop).toBe(1150);
        });

        it('ignores sub-pixel drift instead of chasing rounding noise', (): void => {
            setupScrolledUp();

            offsetTops.set('message-msg-1', 1000.4);
            act((): void => {
                triggerResize();
            });

            expect(scroller().scrollTop).toBe(1000);
        });

        it('stays pinned to the bottom when a new message arrives', (): void => {
            const { rerender } = render(
                <MessagesList hasMore={false} messages={[]} />,
            );
            setScrollerGeometry(3000, 800);
            rerender(<MessagesList hasMore={false} messages={mockMessages} />);
            expect(scroller().scrollTop).toBe(2200);

            setScrollerGeometry(3400, 800);
            rerender(
                <MessagesList
                    hasMore={false}
                    messages={[...mockMessages, msg('msg-3')]}
                />,
            );

            expect(scroller().scrollTop).toBe(2600);
        });
    });

    describe('at-bottom reporting', (): void => {
        it('reports leaving and returning to the bottom', (): void => {
            const onAtBottomChange = vi.fn();
            const { rerender } = render(
                <MessagesList
                    hasMore={false}
                    messages={[]}
                    onAtBottomChange={onAtBottomChange}
                />,
            );
            setScrollerGeometry(5000, 800);
            rerender(
                <MessagesList
                    hasMore={false}
                    messages={mockMessages}
                    onAtBottomChange={onAtBottomChange}
                />,
            );

            scrollTo(1000);
            expect(onAtBottomChange).toHaveBeenLastCalledWith(false);

            scrollTo(4200);
            expect(onAtBottomChange).toHaveBeenLastCalledWith(true);
        });

        it('treats being within the 2px tolerance as at the bottom', (): void => {
            const onAtBottomChange = vi.fn();
            const { rerender } = render(
                <MessagesList
                    hasMore={false}
                    messages={[]}
                    onAtBottomChange={onAtBottomChange}
                />,
            );
            setScrollerGeometry(5000, 800);
            rerender(
                <MessagesList
                    hasMore={false}
                    messages={mockMessages}
                    onAtBottomChange={onAtBottomChange}
                />,
            );

            scrollTo(4199);
            expect(onAtBottomChange).toHaveBeenLastCalledWith(true);
        });

        it('reports not-at-bottom while a jump target is active', (): void => {
            const onAtBottomChange = vi.fn();
            const { rerender } = render(
                <MessagesList
                    activeHighlightId="msg-2"
                    hasMore={false}
                    messages={[]}
                    onAtBottomChange={onAtBottomChange}
                />,
            );
            setScrollerGeometry(5000, 800);
            rerender(
                <MessagesList
                    activeHighlightId="msg-2"
                    hasMore={false}
                    messages={mockMessages}
                    onAtBottomChange={onAtBottomChange}
                />,
            );

            scrollTo(4200);
            expect(onAtBottomChange).toHaveBeenLastCalledWith(false);
        });
    });

    it('scrollToBottom() targets the true bottom', (): void => {
        const handleRef = {
            current: null as null | { scrollToBottom: () => void },
        };
        const { rerender } = render(
            <MessagesList hasMore={false} messages={[]} ref={handleRef} />,
        );
        setScrollerGeometry(5000, 800);
        rerender(
            <MessagesList
                hasMore={false}
                messages={mockMessages}
                ref={handleRef}
            />,
        );
        scrollTo(500);

        act((): void => {
            handleRef.current?.scrollToBottom();
        });

        expect(scroller().scrollTop).toBeGreaterThanOrEqual(500);
    });

    describe('scrollToBottom() completion callback', (): void => {
        const renderAtOffset = (): {
            current: null | {
                scrollToBottom: (onSettled?: () => void) => void;
            };
        } => {
            const handleRef = {
                current: null as null | {
                    scrollToBottom: (onSettled?: () => void) => void;
                },
            };
            const { rerender } = render(
                <MessagesList hasMore={false} messages={[]} ref={handleRef} />,
            );
            setScrollerGeometry(5000, 800);
            rerender(
                <MessagesList
                    hasMore={false}
                    messages={mockMessages}
                    ref={handleRef}
                />,
            );
            scrollTo(500);
            return handleRef;
        };

        beforeEach((): void => {
            vi.useFakeTimers();
        });

        afterEach((): void => {
            vi.useRealTimers();
        });

        it('does not fire until the spring actually settles', (): void => {
            const handleRef = renderAtOffset();
            const onSettled = vi.fn();

            act((): void => {
                handleRef.current?.scrollToBottom(onSettled);
            });
            expect(onSettled).not.toHaveBeenCalled();

            act((): void => {
                vi.advanceTimersByTime(32);
            });
            expect(onSettled).not.toHaveBeenCalled();

            act((): void => {
                vi.advanceTimersByTime(2000);
            });
            expect(onSettled).toHaveBeenCalledTimes(1);
        });

        it('is dropped, not fired late, if the reader interrupts the animation', (): void => {
            const handleRef = renderAtOffset();
            const onSettled = vi.fn();

            act((): void => {
                handleRef.current?.scrollToBottom(onSettled);
            });
            act((): void => {
                vi.advanceTimersByTime(32);
            });

            act((): void => {
                fireEvent.wheel(scroller());
            });
            act((): void => {
                vi.advanceTimersByTime(2000);
            });

            expect(onSettled).not.toHaveBeenCalled();
        });
    });

    describe('an animation already in flight', (): void => {
        const startAnimation = (): {
            rerender: (ui: React.ReactElement) => void;
        } => {
            const handleRef = {
                current: null as null | { scrollToBottom: () => void },
            };
            const { rerender } = render(
                <MessagesList hasMore={false} messages={[]} ref={handleRef} />,
            );
            setScrollerGeometry(5000, 800);
            rerender(
                <MessagesList
                    hasMore={false}
                    messages={mockMessages}
                    ref={handleRef}
                />,
            );
            scrollTo(500);

            act((): void => {
                handleRef.current?.scrollToBottom();
            });
            act((): void => {
                vi.advanceTimersByTime(32);
            });
            return { rerender };
        };

        beforeEach((): void => {
            vi.useFakeTimers();
        });

        afterEach((): void => {
            vi.useRealTimers();
        });

        it('never drags the view off a jump target placed while it ran', (): void => {
            const { rerender } = startAnimation();
            expect(scroller().scrollTop).toBeGreaterThan(500);

            offsetTops.set('message-msg-2', 500);
            offsetHeights.set('message-msg-2', 100);
            act((): void => {
                rerender(
                    <MessagesList
                        activeHighlightId="msg-2"
                        hasMore={false}
                        messages={mockMessages}
                    />,
                );
            });
            expect(scroller().scrollTop).toBe(500 - 400 + 50);

            act((): void => {
                vi.advanceTimersByTime(2000);
            });
            expect(scroller().scrollTop).toBe(500 - 400 + 50);
        });

        it('stops the moment the reader scrolls', (): void => {
            startAnimation();
            const interrupted = scroller().scrollTop;
            expect(interrupted).toBeGreaterThan(500);

            act((): void => {
                fireEvent.wheel(scroller());
            });
            act((): void => {
                vi.advanceTimersByTime(2000);
            });

            expect(scroller().scrollTop).toBe(interrupted);
        });
    });
});
