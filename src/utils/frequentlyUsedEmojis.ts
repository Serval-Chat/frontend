import type { FrequentlyUsedEmojiEntry } from '@/api/frequentlyUsedEmojis/frequentlyUsedEmojis.types';

export const MAX_FREQUENTLY_USED_EMOJIS = 40;
export const QUICK_REACTION_COUNT = 6;

export interface EmojiUsageInput {
    emoji: string;
    emojiType: 'unicode' | 'custom';
    emojiId?: string;
}

const keyOf = (e: EmojiUsageInput): string =>
    e.emojiType === 'custom' ? `custom:${e.emojiId ?? ''}` : `unicode:${e.emoji}`;

export const recordEmojiUsage = (
    list: FrequentlyUsedEmojiEntry[],
    used: EmojiUsageInput,
    now: string = new Date().toISOString(),
): FrequentlyUsedEmojiEntry[] => {
    if (used.emojiType === 'custom' && !used.emojiId) return list;

    const targetKey = keyOf(used);
    const existingIndex = list.findIndex((e) => keyOf(e) === targetKey);

    let next: FrequentlyUsedEmojiEntry[];
    if (existingIndex !== -1) {
        next = list.map((e, i) =>
            i === existingIndex
                ? { ...e, count: e.count + 1, lastUsedAt: now }
                : e,
        );
    } else {
        const newEntry: FrequentlyUsedEmojiEntry = {
            emoji: used.emoji,
            emojiType: used.emojiType,
            emojiId: used.emojiId,
            count: 1,
            lastUsedAt: now,
        };
        next = [...list, newEntry];
    }

    if (next.length <= MAX_FREQUENTLY_USED_EMOJIS) return next;

    let evictIndex = 0;
    for (let i = 1; i < next.length; i++) {
        const candidate = next[i];
        const current = next[evictIndex];
        if (!candidate || !current) continue;
        if (
            candidate.count < current.count ||
            (candidate.count === current.count &&
                candidate.lastUsedAt < current.lastUsedAt)
        ) {
            evictIndex = i;
        }
    }
    return next.filter((_, i) => i !== evictIndex);
};

export const sortByFrequency = (
    list: FrequentlyUsedEmojiEntry[],
): FrequentlyUsedEmojiEntry[] =>
    [...list].sort((a, b) =>
        b.count !== a.count
            ? b.count - a.count
            : b.lastUsedAt.localeCompare(a.lastUsedAt),
    );

export const getTopEmojis = (
    list: FrequentlyUsedEmojiEntry[],
    n: number = QUICK_REACTION_COUNT,
): FrequentlyUsedEmojiEntry[] => sortByFrequency(list).slice(0, n);
