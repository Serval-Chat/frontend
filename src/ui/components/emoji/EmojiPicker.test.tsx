import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EmojiPicker } from './EmojiPicker';

type MatchMediaStub = ReturnType<typeof vi.fn> & {
    __setMatches: (matches: boolean) => void;
};

const setMatchMedia = (matches: boolean): void => {
    (globalThis.matchMedia as MatchMediaStub).__setMatches(matches);
};

const renderPicker = (onClickAway = vi.fn()): void => {
    const queryClient = new QueryClient();
    render(
        <QueryClientProvider client={queryClient}>
            <EmojiPicker onClickAway={onClickAway} onEmojiSelect={vi.fn()} />
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
