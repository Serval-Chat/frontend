export interface FrequentlyUsedEmojiEntry {
    emoji: string;
    emojiType: 'unicode' | 'custom';
    emojiId?: string;
    count: number;
    lastUsedAt: string;
}
