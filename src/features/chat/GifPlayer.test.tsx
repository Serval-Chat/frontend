import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { klipyApi } from '@/api/klipy/klipy.api';
import type { KlipyFavorite } from '@/api/klipy/klipy.types';
import { useLimitedAnimations } from '@/providers/limitedAnimationsContext';

import { GifPlayer } from './GifPlayer';

vi.mock('@/api/klipy/klipy.api', () => ({
    klipyApi: {
        resolveGif: vi.fn(),
        getFavorites: vi.fn(),
        toggleFavorite: vi.fn(),
    },
}));

vi.mock('@/providers/limitedAnimationsContext', () => ({
    useLimitedAnimations: vi.fn().mockReturnValue(false),
}));

vi.mock('./GifStarButton', () => {
    const GifStarButton = ({ isFavorited }: { isFavorited: boolean }) => (
        <button
            data-favorited={isFavorited}
            data-testid="gif-star"
            type="button"
        >
            star
        </button>
    );
    return { GifStarButton };
});

const metadata: KlipyFavorite = {
    klipyId: 'true-id-1',
    slug: 'funny-cat',
    url: 'https://media.klipy.com/gifs/funny-cat.gif',
    previewUrl: 'https://media.klipy.com/gifs/funny-cat-preview.gif',
    width: 400,
    height: 300,
    contentType: 'gif',
};

const messageUrl = 'https://klipy.com/gifs/funny-cat';

function renderPlayer(klipyIdFromMessage: string): ReturnType<typeof render> {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <GifPlayer klipyId={klipyIdFromMessage} url={messageUrl} />
        </QueryClientProvider>,
    );
}

describe('GifPlayer favorite state', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(useLimitedAnimations).mockReturnValue(false);
        vi.mocked(klipyApi.resolveGif).mockResolvedValue(metadata);
    });

    it('shows starred when the message klipyId (the true id) matches a favorite', async (): Promise<void> => {
        vi.mocked(klipyApi.getFavorites).mockResolvedValue([
            { ...metadata, klipyId: 'true-id-1' },
        ]);

        renderPlayer('true-id-1');

        await waitFor((): void => {
            expect(screen.getByTestId('gif-star')).toHaveAttribute(
                'data-favorited',
                'true',
            );
        });
    });

    it('still shows starred when the message embeds the GIF by its slug ', async (): Promise<void> => {
        vi.mocked(klipyApi.getFavorites).mockResolvedValue([
            { ...metadata, klipyId: 'true-id-1', url: messageUrl },
        ]);

        renderPlayer('funny-cat');

        await waitFor((): void => {
            expect(screen.getByTestId('gif-star')).toHaveAttribute(
                'data-favorited',
                'true',
            );
        });
    });

    it('shows unstarred when no favorite matches by id or url', async (): Promise<void> => {
        vi.mocked(klipyApi.getFavorites).mockResolvedValue([
            {
                ...metadata,
                klipyId: 'some-other-gif',
                url: 'https://media.klipy.com/gifs/other.gif',
            },
        ]);

        renderPlayer('funny-cat');

        await waitFor((): void => {
            expect(screen.getByTestId('gif-star')).toHaveAttribute(
                'data-favorited',
                'false',
            );
        });
    });
});
