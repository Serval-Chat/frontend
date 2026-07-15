import { render } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppSelector } from '@/store/hooks';
import type { ProcessedChatMessage } from '@/types/chat.ui';
import { MessagesListNative } from '@/ui/components/chat/MessagesListNative';

vi.mock('@/store/hooks', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('@/ui/components/chat/MessageItem', () => ({
    MessageItem: ({ message }: { message: { id: string; text: string } }) => (
        <div data-testid={`message-${message.id}`}>{message.text}</div>
    ),
}));

const mockMessages = [
    { id: 'msg-1', text: 'Hello', senderId: 'u1' },
    { id: 'msg-2', text: 'World', senderId: 'u2' },
] as unknown as ProcessedChatMessage[];

describe('MessagesListNative', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAppSelector).mockReturnValue(
            {} as unknown as Record<string, number>,
        );
    });

    it('renders every message as real DOM with a data-message-id', () => {
        const { container, getByText } = render(
            <MessagesListNative hasMore={false} messages={mockMessages} />,
        );

        expect(getByText('Hello')).toBeTruthy();
        expect(getByText('World')).toBeTruthy();
        expect(
            container.querySelector('[data-message-id="msg-1"]'),
        ).toBeTruthy();
        expect(
            container.querySelector('[data-message-id="msg-2"]'),
        ).toBeTruthy();
    });

    it('centers the jump target on its real rendered rect', () => {
        // drive the settle loop with a controlled clock so it terminates.
        let clock = 0;
        vi.spyOn(globalThis, 'requestAnimationFrame').mockImplementation(
            (cb: FrameRequestCallback): number => {
                clock += 40;
                cb(clock);
                return clock;
            },
        );
        vi.spyOn(performance, 'now').mockImplementation((): number => clock);

        vi.spyOn(
            HTMLElement.prototype,
            'clientHeight',
            'get',
        ).mockReturnValue(600);
        vi.spyOn(
            HTMLElement.prototype,
            'getBoundingClientRect',
        ).mockImplementation(function (this: HTMLElement): DOMRect {
            if (this.classList.contains('custom-scrollbar')) {
                return { top: 0, height: 600 } as DOMRect;
            }
            if (this.getAttribute('data-message-id') === 'msg-2') {
                const scroller = this.closest(
                    '.custom-scrollbar',
                ) as HTMLElement | null;
                const scrollTop = scroller?.scrollTop ?? 0;
                // target sits 400px below the container top, tracking scrollTop.
                return { top: 400 - scrollTop, height: 100 } as DOMRect;
            }
            return { top: 0, height: 0 } as DOMRect;
        });

        const { container } = render(
            <MessagesListNative
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

        vi.restoreAllMocks();
    });
});
