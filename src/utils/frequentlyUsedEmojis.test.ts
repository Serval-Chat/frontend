import { describe, expect, test } from 'vitest';

import type { FrequentlyUsedEmojiEntry } from '@/api/frequentlyUsedEmojis/frequentlyUsedEmojis.types';

import {
    MAX_FREQUENTLY_USED_EMOJIS,
    getTopEmojis,
    recordEmojiUsage,
    sortByFrequency,
} from './frequentlyUsedEmojis';

describe('recordEmojiUsage', () => {
    test('adds a new unicode entry with count 1', () => {
        const next = recordEmojiUsage([], { emoji: '😀', emojiType: 'unicode' });
        expect(next).toEqual([
            {
                emoji: '😀',
                emojiType: 'unicode',
                emojiId: undefined,
                count: 1,
                lastUsedAt: expect.any(String),
            },
        ]);
    });

    test('increments an existing unicode entry instead of duplicating it', () => {
        const first = recordEmojiUsage(
            [],
            { emoji: '😀', emojiType: 'unicode' },
            '2026-01-01T00:00:00.000Z',
        );
        const second = recordEmojiUsage(
            first,
            { emoji: '😀', emojiType: 'unicode' },
            '2026-01-02T00:00:00.000Z',
        );

        expect(second).toHaveLength(1);
        expect(second[0]?.count).toBe(2);
        expect(second[0]?.lastUsedAt).toBe('2026-01-02T00:00:00.000Z');
    });

    test('treats distinct custom emojis with the same name as separate entries', () => {
        const list = recordEmojiUsage(
            recordEmojiUsage([], {
                emoji: 'party_blob',
                emojiType: 'custom',
                emojiId: '1',
            }),
            { emoji: 'party_blob', emojiType: 'custom', emojiId: '2' },
        );
        expect(list).toHaveLength(2);
    });

    test('ignores a custom usage with no emojiId', () => {
        const next = recordEmojiUsage([], {
            emoji: 'party_blob',
            emojiType: 'custom',
        });
        expect(next).toEqual([]);
    });

    test('evicts the least-frequently-used entry once over the cap', () => {
        let list: FrequentlyUsedEmojiEntry[] = [];
        for (let i = 0; i < MAX_FREQUENTLY_USED_EMOJIS; i++) {
            list = recordEmojiUsage(
                list,
                { emoji: `emoji-${i}`, emojiType: 'unicode' },
                `2026-01-01T00:00:${String(i).padStart(2, '0')}.000Z`,
            );
        }
        expect(list).toHaveLength(MAX_FREQUENTLY_USED_EMOJIS);

        for (let i = 1; i < MAX_FREQUENTLY_USED_EMOJIS; i++) {
            list = recordEmojiUsage(list, {
                emoji: `emoji-${i}`,
                emojiType: 'unicode',
            });
        }
        expect(list).toHaveLength(MAX_FREQUENTLY_USED_EMOJIS);

        list = recordEmojiUsage(list, {
            emoji: 'brand-new',
            emojiType: 'unicode',
        });

        expect(list).toHaveLength(MAX_FREQUENTLY_USED_EMOJIS);
        expect(list.find((e) => e.emoji === 'emoji-0')).toBeUndefined();
        expect(list.find((e) => e.emoji === 'brand-new')).toBeDefined();
    });

    test('never grows past the cap regardless of how many distinct emojis are recorded', () => {
        let list: FrequentlyUsedEmojiEntry[] = [];
        for (let i = 0; i < MAX_FREQUENTLY_USED_EMOJIS + 25; i++) {
            list = recordEmojiUsage(list, {
                emoji: `emoji-${i}`,
                emojiType: 'unicode',
            });
        }
        expect(list.length).toBeLessThanOrEqual(MAX_FREQUENTLY_USED_EMOJIS);
    });
});

describe('sortByFrequency / getTopEmojis', () => {
    const entries: FrequentlyUsedEmojiEntry[] = [
        { emoji: 'a', emojiType: 'unicode', count: 3, lastUsedAt: '2026-01-01T00:00:00.000Z' },
        { emoji: 'b', emojiType: 'unicode', count: 5, lastUsedAt: '2026-01-01T00:00:00.000Z' },
        { emoji: 'c', emojiType: 'unicode', count: 5, lastUsedAt: '2026-01-02T00:00:00.000Z' },
        { emoji: 'd', emojiType: 'unicode', count: 1, lastUsedAt: '2026-01-05T00:00:00.000Z' },
    ];

    test('sorts by count descending, ties broken by most-recent use', () => {
        const sorted = sortByFrequency(entries).map((e) => e.emoji);
        expect(sorted).toEqual(['c', 'b', 'a', 'd']);
    });

    test('does not mutate the input array', () => {
        const copy = [...entries];
        sortByFrequency(entries);
        expect(entries).toEqual(copy);
    });

    test('getTopEmojis returns only the top N', () => {
        expect(getTopEmojis(entries, 2).map((e) => e.emoji)).toEqual(['c', 'b']);
    });

    test('getTopEmojis defaults to the quick-reaction count', () => {
        expect(getTopEmojis(entries).length).toBeLessThanOrEqual(entries.length);
    });
});
