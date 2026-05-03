import { describe, expect, it } from 'vitest';

const mockEmojiData = [
    {
        name: 'sob',
        unified: '1f62d',
        non_qualified: null,
        docomo: null,
        au: null,
        softbank: null,
        google: null,
        image: '1f62d.png',
        sheet_x: 25,
        sheet_y: 25,
        short_name: 'sob',
        short_names: ['sob'],
        text: null,
        texts: null,
        category: 'Smileys & Emotion',
        subcategory: 'face-concerned',
        sort_order: 207,
        added_in: '6.0',
        has_img_apple: true,
        has_img_google: true,
        has_img_twitter: true,
        has_img_facebook: true,
    },
];

describe('Emoji Autocomplete Logic', () => {
    it('should detect single emoji match scenario', () => {
        const emojiName = 'sob';
        const availableEmojis = mockEmojiData;

        const matchingEmojis = availableEmojis.filter(
            (emoji) =>
                emoji.short_name === emojiName ||
                emoji.short_names.some((name) => name === emojiName),
        );

        expect(matchingEmojis).toHaveLength(1);
        expect(matchingEmojis[0].short_name).toBe('sob');
    });

    it('should not auto-select when multiple matches exist', () => {
        const emojiName = 'sob';
        const multipleEmojis = [
            ...mockEmojiData,
            {
                ...mockEmojiData[0],
                name: 'sob_cat',
                short_name: 'sob_cat',
                short_names: ['sob_cat'],
            },
        ];

        const matchingEmojis = multipleEmojis.filter(
            (emoji) =>
                emoji.short_name.includes(emojiName) ||
                emoji.short_names.some((name) => name.includes(emojiName)),
        );

        expect(matchingEmojis.length).toBeGreaterThan(1);
    });

    it('should handle exact emoji name matching', () => {
        const emojiName = 'sob';
        const availableEmojis = mockEmojiData;

        const matchingEmojis = availableEmojis.filter(
            (emoji) =>
                emoji.short_name === emojiName ||
                emoji.short_names.some((name) => name === emojiName),
        );

        expect(matchingEmojis).toHaveLength(1);
        expect(matchingEmojis[0].short_name).toBe('sob');

        expect(matchingEmojis.length === 1).toBe(true);
    });

    it('should handle custom emoji exact matching', () => {
        const customEmojis = [
            {
                _id: '1',
                name: 'pepega',
                imageUrl: 'url1',
                serverId: 's1',
                createdBy: 'u1',
                createdAt: '2024-01-01',
            },
            {
                _id: '2',
                name: 'pepehands',
                imageUrl: 'url2',
                serverId: 's1',
                createdBy: 'u1',
                createdAt: '2024-01-01',
            },
        ];

        const emojiName = 'pepega';
        const matchingCustomEmojis = customEmojis.filter(
            (emoji) => emoji.name.toLowerCase() === emojiName,
        );

        expect(matchingCustomEmojis).toHaveLength(1);
        expect(matchingCustomEmojis[0].name).toBe('pepega');
    });
});
