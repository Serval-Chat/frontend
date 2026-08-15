import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { FREQUENTLY_USED_CATEGORY_ID } from '@/hooks/useFrequentlyUsedEmojis';

import { type CustomEmojiCategory, EmojiPicker } from './EmojiPicker';

type MatchMediaStub = ReturnType<typeof vi.fn> & {
    __setMatches: (matches: boolean) => void;
};

const setMatchMedia = (matches: boolean): void => {
    (globalThis.matchMedia as MatchMediaStub).__setMatches(matches);
};

const renderPicker = (
    onClickAway = vi.fn(),
    customCategories: CustomEmojiCategory[] = [],
): void => {
    const queryClient = new QueryClient();
    render(
        <QueryClientProvider client={queryClient}>
            <EmojiPicker
                customCategories={customCategories}
                onClickAway={onClickAway}
                onEmojiSelect={vi.fn()}
            />
        </QueryClientProvider>,
    );
};

describe('EmojiPicker mobile bottom sheet', (): void => {
    it('renders inline on desktop without a backdrop', (): void => {
        renderPicker();

        expect(screen.queryByLabelText('Close emoji picker')).toBeNull();
        expect(document.querySelector('.rounded-t-2xl')).toBeNull();
    });

    it('renders a full-width half-height sheet at the bottom on mobile', (): void => {
        act((): void => {
            setMatchMedia(true);
        });
        renderPicker();

        const sheet = document.querySelector('.rounded-t-2xl');
        expect(sheet).not.toBeNull();
        expect(sheet).toHaveStyle({
            height: `${Math.round(window.innerHeight / 2)}px`,
            bottom: '0px',
        });
    });

    it('calls onClickAway when the backdrop is tapped on mobile', (): void => {
        act((): void => {
            setMatchMedia(true);
        });
        const onClickAway = vi.fn();
        renderPicker(onClickAway);

        act((): void => {
            fireEvent.click(screen.getByLabelText('Close emoji picker'));
        });
        expect(onClickAway).toHaveBeenCalled();
    });
});

describe('EmojiPicker frequently used category', (): void => {
    const starIn = (): boolean =>
        document.querySelector('.lucide-star') !== null;

    it('renders a golden star icon for the frequently used category', (): void => {
        renderPicker(vi.fn(), [
            {
                id: FREQUENTLY_USED_CATEGORY_ID,
                name: 'Frequently Used',
                emojis: [{ id: 'e1', name: 'smile', url: '/smile.png' }],
            },
        ]);

        expect(starIn()).toBe(true);
    });

    it('renders a server icon for regular custom categories', (): void => {
        renderPicker(vi.fn(), [
            {
                id: 'server-cat',
                name: 'Server Emojis',
                emojis: [{ id: 'e1', name: 'smile', url: '/smile.png' }],
            },
        ]);

        expect(starIn()).toBe(false);
    });
});
