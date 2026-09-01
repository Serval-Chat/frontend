import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useEmoji } from '@/api/emojis/emojis.queries';
import { ParsedEmoji } from '@/ui/components/common/ParsedEmoji';

vi.mock('@/api/emojis/emojis.queries', () => ({
    useEmoji: vi.fn(),
    emojiKeys: { detail: (id: string): string[] => ['emoji', id] },
}));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: (): { getQueryData: () => unknown } => ({
        getQueryData: (): unknown => ({ id: 'e1' }),
    }),
}));

vi.mock('@/hooks/useEmojiInfoBox', () => ({
    useEmojiInfoBox: (): Record<string, unknown> => ({
        selectedEmoji: null,
        infoBoxPosition: null,
        server: undefined,
        showEmojiInfo: vi.fn(),
        closeInfoBox: vi.fn(),
    }),
}));

const SIZE_CLASSES = ['h-[1.5em]', 'w-[1.5em]'];

describe('ParsedEmoji', () => {
    beforeEach(() => {
        vi.mocked(useEmoji).mockReset();
    });

    it('reserves the same box while loading as the loaded emoji occupies', () => {
        vi.mocked(useEmoji).mockReturnValue({
            data: undefined,
            isLoading: true,
        } as ReturnType<typeof useEmoji>);

        const { container, rerender } = render(
            <ParsedEmoji nonInteractive emojiId="e1" />,
        );
        const placeholder = container.firstElementChild;
        expect(placeholder).not.toBeNull();
        for (const cls of SIZE_CLASSES) {
            expect(placeholder?.className).toContain(cls);
        }
        expect(placeholder?.className).toContain('align-text-bottom');

        vi.mocked(useEmoji).mockReturnValue({
            data: {
                id: 'e1',
                name: 'party',
                imageUrl: '/emoji/e1.webp',
                serverId: 's1',
            },
            isLoading: false,
        } as unknown as ReturnType<typeof useEmoji>);

        rerender(<ParsedEmoji nonInteractive emojiId="e1" />);
        const loaded = screen.getByAltText('party');
        for (const cls of SIZE_CLASSES) {
            expect(loaded.className).toContain(cls);
        }
        expect(loaded.className).toContain('align-text-bottom');
    });

    it('keeps a caller className additive rather than dropping the reserved size', () => {
        vi.mocked(useEmoji).mockReturnValue({
            data: undefined,
            isLoading: true,
        } as ReturnType<typeof useEmoji>);

        const { container } = render(
            <ParsedEmoji nonInteractive className="custom-x" emojiId="e1" />,
        );
        const placeholder = container.firstElementChild;
        expect(placeholder?.className).toContain('custom-x');
        for (const cls of SIZE_CLASSES) {
            expect(placeholder?.className).toContain(cls);
        }
    });

    it('uses the large box in both states when isLarge is set', () => {
        vi.mocked(useEmoji).mockReturnValue({
            data: undefined,
            isLoading: true,
        } as ReturnType<typeof useEmoji>);

        const { container, rerender } = render(
            <ParsedEmoji isLarge nonInteractive emojiId="e1" />,
        );
        expect(container.firstElementChild?.className).toContain('h-16');

        vi.mocked(useEmoji).mockReturnValue({
            data: {
                id: 'e1',
                name: 'party',
                imageUrl: '/emoji/e1.webp',
                serverId: 's1',
            },
            isLoading: false,
        } as unknown as ReturnType<typeof useEmoji>);
        rerender(<ParsedEmoji isLarge nonInteractive emojiId="e1" />);
        expect(screen.getByAltText('party').className).toContain('h-16');
    });
});
