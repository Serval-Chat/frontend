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
        const text = 'Check out https://rolling.catfla.re for more';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Check out ' },
            {
                type: 'link',
                url: 'https://rolling.catfla.re',
                text: 'https://rolling.catfla.re',
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

    it('should parse headings', () => {
        const text = '# Heading 1\n## Heading 2\n### Heading 3';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'h1', content: 'Heading 1' },
            { type: 'text', content: '\n' },
            { type: 'h2', content: 'Heading 2' },
            { type: 'text', content: '\n' },
            { type: 'h3', content: 'Heading 3' },
        ]);
    });

    it('should parse subtext', () => {
        const text = '-# This is subtext';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'subtext', content: 'This is subtext' },
        ]);
    });

    it('should parse spoilers', () => {
        const text = 'This is a ||spoiler|| message';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'This is a ' },
            { type: 'spoiler', content: 'spoiler' },
            { type: 'text', content: ' message' },
        ]);
    });

    it('should parse inline code', () => {
        const text = 'Use `npm install` to get started';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Use ' },
            { type: 'inline_code', content: 'npm install' },
            { type: 'text', content: ' to get started' },
        ]);
    });

    it('should parse code blocks', () => {
        const text = '```typescript\nconst x = 1;\n```';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'code_block',
                content: 'const x = 1;',
                language: 'typescript',
            },
        ]);
    });

    it('should parse invite links', () => {
        const text = 'Join us: https://catfla.re/invite/serchat-dev';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Join us: ' },
            {
                type: 'invite',
                code: 'serchat-dev',
                url: 'https://catfla.re/invite/serchat-dev',
            },
        ]);
    });

    it('should parse rolling invite links', () => {
        const text = 'https://rolling.catfla.re/invite/special';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'invite',
                code: 'special',
                url: 'https://rolling.catfla.re/invite/special',
            },
        ]);
    });

    it('should parse file embeds', () => {
        const text = '[%file%](https://example.com/image.png)';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'file',
                url: 'https://example.com/image.png',
            },
        ]);
    });

    it('should parse named links', () => {
        const text = 'Check [Serchat](https://rolling.catfla.re) now';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Check ' },
            {
                type: 'link',
                url: 'https://rolling.catfla.re',
                text: 'Serchat',
            },
            { type: 'text', content: ' now' },
        ]);
    });

    it('should parse named links within another element', () => {
        const text = '# Check [Serchat](https://rolling.catfla.re) now';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'h1',
                content: [
                    { type: 'text', content: 'Check ' },
                    {
                        type: 'link',
                        url: 'https://rolling.catfla.re',
                        text: 'Serchat',
                    },
                    { type: 'text', content: ' now' },
                ],
            },
        ]);
    });

    it('should parse bold within italic', () => {
        const text = 'This is *italic and **bold** text*';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'This is ' },
            {
                type: 'italic',
                content: [
                    { type: 'text', content: 'italic and ' },
                    { type: 'bold', content: 'bold' },
                    { type: 'text', content: ' text' },
                ],
            },
        ]);
    });

    it('should parse links within spoilers', () => {
        const text = 'Secret: ||[Serchat](https://rolling.catfla.re)||';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Secret: ' },
            {
                type: 'spoiler',
                content: [
                    {
                        type: 'link',
                        url: 'https://rolling.catfla.re',
                        text: 'Serchat',
                    },
                ],
            },
        ]);
    });
});
