import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { frequentlyUsedEmojisKeys } from '@/api/frequentlyUsedEmojis/frequentlyUsedEmojis.queries';
import type { FrequentlyUsedEmojiEntry } from '@/api/frequentlyUsedEmojis/frequentlyUsedEmojis.types';
import {
    useFrequentlyUsedEmojis,
    useRecordEmojiUsage,
} from '@/hooks/useFrequentlyUsedEmojis';

vi.mock('@/api/frequentlyUsedEmojis/frequentlyUsedEmojis.api', () => ({
    frequentlyUsedEmojisApi: {
        get: vi.fn().mockResolvedValue({ emojis: [] }),
        update: vi.fn().mockResolvedValue({ message: 'ok', emojis: [] }),
    },
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useAllServerEmojis: () => ({ data: [] }),
}));

const entry = (emoji: string, count: number): FrequentlyUsedEmojiEntry => ({
    emoji,
    emojiType: 'unicode',
    count,
    lastUsedAt: '2026-01-01T00:00:00.000Z',
});

// Six clear leaders plus a rarely used seventh emoji.
const seed = (): FrequentlyUsedEmojiEntry[] => [
    entry('😀', 100),
    entry('😂', 90),
    entry('❤️', 80),
    entry('👍', 70),
    entry('🔥', 60),
    entry('🎉', 50),
    entry('🐱', 1),
];

let queryClient: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) =>
    React.createElement(QueryClientProvider, { client: queryClient }, children);

beforeEach((): void => {
    queryClient = new QueryClient();
    queryClient.setQueryData(['me'], { id: 'me' });
    queryClient.setQueryData(frequentlyUsedEmojisKeys.all, seed());
});

describe('useRecordEmojiUsage', (): void => {
    it('records a pick without re-rendering when the list changes', async (): Promise<void> => {
        let recorderRenders = 0;
        const recorder = renderHook(
            () => {
                recorderRenders += 1;
                return useRecordEmojiUsage();
            },
            { wrapper },
        );
        const subscriber = renderHook(() => useFrequentlyUsedEmojis(), {
            wrapper,
        });
        const categoryBefore = subscriber.result.current.frequentlyUsedCategory;
        const rendersBefore = recorderRenders;

        act((): void => {
            recorder.result.current({ emoji: '🐱', emojiType: 'unicode' });
        });

        // Positive control: a subscriber did receive the update.
        await waitFor((): void => {
            expect(subscriber.result.current.frequentlyUsedCategory).not.toBe(
                categoryBefore,
            );
        });
        const stored = queryClient.getQueryData<FrequentlyUsedEmojiEntry[]>(
            frequentlyUsedEmojisKeys.all,
        );
        expect(stored?.find((e) => e.emoji === '🐱')?.count).toBe(2);
        expect(recorderRenders).toBe(rendersBefore);
    });
});

describe('useFrequentlyUsedEmojis quickReactions', (): void => {
    it('keeps the same array when a pick does not change the top emojis', async (): Promise<void> => {
        const { result } = renderHook(() => useFrequentlyUsedEmojis(), {
            wrapper,
        });
        const before = result.current.quickReactions;
        const categoryBefore = result.current.frequentlyUsedCategory;
        expect(before.map((q) => q.emoji)).toEqual([
            '😀',
            '😂',
            '❤️',
            '👍',
            '🔥',
            '🎉',
        ]);

        act((): void => {
            result.current.recordUsage({ emoji: '🐱', emojiType: 'unicode' });
        });

        await waitFor((): void => {
            expect(result.current.frequentlyUsedCategory).not.toBe(
                categoryBefore,
            );
        });
        expect(result.current.quickReactions).toBe(before);
    });

    it('returns a new array when the top emojis change', async (): Promise<void> => {
        const { result } = renderHook(() => useFrequentlyUsedEmojis(), {
            wrapper,
        });
        const before = result.current.quickReactions;

        act((): void => {
            queryClient.setQueryData(frequentlyUsedEmojisKeys.all, [
                ...seed().filter((e) => e.emoji !== '🐱'),
                entry('🐱', 500),
            ]);
        });

        await waitFor((): void => {
            expect(result.current.quickReactions[0]?.emoji).toBe('🐱');
        });
        expect(result.current.quickReactions).not.toBe(before);
    });
});
