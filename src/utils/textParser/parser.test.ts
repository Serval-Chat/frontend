import { describe, expect, it } from 'vitest';

import { ParserPresets, parseText } from './parser';

describe('TextParser', () => {
    it('should parse bold text', () => {
        const text = 'Hello **bold** world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'bold', content: 'bold' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse italic text', () => {
        const text = 'Hello *italic* world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'italic', content: 'italic' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse bold-italic text', () => {
        const text = 'Hello ***bold italic*** world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'bold_italic', content: 'bold italic' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse custom emojis', () => {
        const text = 'Hello <emoji:happy_cat> world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'emoji', emojiId: 'happy_cat' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse links', () => {
        const text = 'Check out https://google.com for more';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Check out ' },
            {
                type: 'link',
                url: 'https://google.com',
                text: 'https://google.com',
            },
            { type: 'text', content: ' for more' },
        ]);
    });

    it('should handle complex mixed text', () => {
        const text =
            '***Bold Italic*** and **Bold** with <emoji:test> and https://link.com';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'bold_italic', content: 'Bold Italic' },
            { type: 'text', content: ' and ' },
            { type: 'bold', content: 'Bold' },
            { type: 'text', content: ' with ' },
            { type: 'emoji', emojiId: 'test' },
            { type: 'text', content: ' and ' },
            { type: 'link', url: 'https://link.com', text: 'https://link.com' },
        ]);
    });
});
