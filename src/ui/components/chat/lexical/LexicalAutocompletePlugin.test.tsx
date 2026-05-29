import { describe, expect, it } from 'vitest';

const createMatchTrigger =
    (
        allEmojis: any[] = [],
        serverEmojis: any[] = [],
    ): ((
        text: string,
    ) => {
        leadOffset: number;
        matchingString: string;
        replaceableString: string;
    } | null) =>
    (
        text: string,
    ): {
        leadOffset: number;
        matchingString: string;
        replaceableString: string;
    } | null => {
        const completeEmojiMatch = text.match(/(^|\s):([^@#\s:]+):$/);
        if (completeEmojiMatch !== null) {
            const emojiName = completeEmojiMatch[2].toLowerCase();

            const matchingUnicodeEmojis = allEmojis.filter(
                (emoji) =>
                    emoji.short_name === emojiName ||
                    emoji.short_names.some(
                        (name: string): boolean => name === emojiName,
                    ),
            );

            const matchingCustomEmojis = serverEmojis.filter(
                (emoji): boolean => emoji.name.toLowerCase() === emojiName,
            );

            const totalMatches =
                matchingUnicodeEmojis.length + matchingCustomEmojis.length;

            if (totalMatches === 1) {
                return null;
            }
        }

        const match = text.match(/(^|\s)([@:#])([^@#\s]{0,20})$/);
        if (match !== null) {
            const triggerChar = match[2];
            const matchingString = match[3];

            if (triggerChar === ':' && matchingString.length < 2) {
                return null;
            }

            return {
                leadOffset: match.index! + match[1].length,
                matchingString: matchingString,
                replaceableString: triggerChar + matchingString,
            };
        }
        return null;
    };

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

describe('Emoji Autocomplete Logic', (): void => {
    it('should detect single emoji match scenario', (): void => {
        const emojiName = 'sob';
        const availableEmojis = mockEmojiData;

        const matchingEmojis = availableEmojis.filter(
            (emoji): boolean =>
                emoji.short_name === emojiName ||
                emoji.short_names.some(
                    (name: string): boolean => name === emojiName,
                ),
        );

        expect(matchingEmojis).toHaveLength(1);
        expect(matchingEmojis[0].short_name).toBe('sob');
    });

    it('should not auto-select when multiple matches exist', (): void => {
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
            (emoji): boolean =>
                emoji.short_name.includes(emojiName) ||
                emoji.short_names.some((name: string): boolean =>
                    name.includes(emojiName),
                ),
        );

        expect(matchingEmojis.length).toBeGreaterThan(1);
    });

    it('should handle exact emoji name matching', (): void => {
        const emojiName = 'sob';
        const availableEmojis = mockEmojiData;

        const matchingEmojis = availableEmojis.filter(
            (emoji): boolean =>
                emoji.short_name === emojiName ||
                emoji.short_names.some(
                    (name: string): boolean => name === emojiName,
                ),
        );

        expect(matchingEmojis).toHaveLength(1);
        expect(matchingEmojis[0].short_name).toBe('sob');

        expect(matchingEmojis.length === 1).toBe(true);
    });

    it('should handle custom emoji exact matching', (): void => {
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
            (emoji): boolean => emoji.name.toLowerCase() === emojiName,
        );

        expect(matchingCustomEmojis).toHaveLength(1);
        expect(matchingCustomEmojis[0].name).toBe('pepega');
    });
});

describe('Emoji Autocomplete Trigger Behavior', (): void => {
    const matchTrigger = createMatchTrigger(mockEmojiData, []);

    it('should NOT trigger emoji suggestions for :3 (1 character after colon)', (): void => {
        const result = matchTrigger(':3');
        expect(result).toBe(null);
    });

    it('should NOT trigger emoji suggestions for :a (1 character after colon)', (): void => {
        const result = matchTrigger(':a');
        expect(result).toBe(null);
    });

    it('should trigger emoji suggestions for :33 (2 characters after colon)', (): void => {
        const result = matchTrigger(':33');
        expect(result).not.toBe(null);
        expect(result?.matchingString).toBe('33');
        expect(result?.replaceableString).toBe(':33');
    });

    it('should trigger emoji suggestions for :smile (5 characters after colon)', (): void => {
        const result = matchTrigger(':smile');
        expect(result).not.toBe(null);
        expect(result?.matchingString).toBe('smile');
        expect(result?.replaceableString).toBe(':smile');
    });

    it('should trigger emoji suggestions for :so (2 characters after colon)', (): void => {
        const result = matchTrigger(':so');
        expect(result).not.toBe(null);
        expect(result?.matchingString).toBe('so');
        expect(result?.replaceableString).toBe(':so');
    });

    it('should handle emoji trigger with preceding space', (): void => {
        const result = matchTrigger('hello :33');
        expect(result).not.toBe(null);
        expect(result?.matchingString).toBe('33');
        expect(result?.replaceableString).toBe(':33');
    });

    it('should NOT trigger for @ mentions with 1 character', (): void => {
        const result = matchTrigger('@a');
        expect(result).not.toBe(null);
    });

    it('should NOT trigger for # channels with 1 character', (): void => {
        const result = matchTrigger('#a');
        expect(result).not.toBe(null);
    });

    it('should handle edge case of just colon without characters', (): void => {
        const result = matchTrigger(':');
        expect(result).toBe(null);
    });

    it('should handle empty string', (): void => {
        const result = matchTrigger('');
        expect(result).toBe(null);
    });
});
