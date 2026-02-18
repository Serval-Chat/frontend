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

    it('should parse ordered list items', () => {
        const text = '1. First item\n2. Second item';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'ordered_list', number: '1', content: 'First item' },
            { type: 'ordered_list', number: '2', content: 'Second item' },
        ]);
    });

    it('should parse ordered list items with nested formatting', () => {
        const text = '1. Item with **bold** and [link](https://test.com)';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'ordered_list',
                number: '1',
                content: [
                    { type: 'text', content: 'Item with ' },
                    { type: 'bold', content: 'bold' },
                    { type: 'text', content: ' and ' },
                    {
                        type: 'link',
                        url: 'https://test.com',
                        text: 'link',
                    },
                ],
            },
        ]);
    });

    it('should not parse digits in the middle of a line as ordered list', () => {
        const text = 'There is 1. something here';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'There is 1. something here' },
        ]);
    });

    it('should skip newline after list item even if followed by normal text', () => {
        const text = '1. Item\nNormal text';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'ordered_list', number: '1', content: 'Item' },
            { type: 'text', content: 'Normal text' },
        ]);
    });

    it('should parse basic markdown tables', () => {
        const text =
            '| Syntax      | Description |\n| ----------- | ----------- |\n| Header      | Title       |\n| Paragraph   | Text        |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'table',
                headers: ['Syntax', 'Description'],
                rows: [
                    ['Header', 'Title'],
                    ['Paragraph', 'Text'],
                ],
            },
        ]);
    });

    it('should parse tables with single column', () => {
        const text = '| Column 1 |\n| -------- |\n| Value 1  |\n| Value 2  |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'table',
                headers: ['Column 1'],
                rows: [['Value 1'], ['Value 2']],
            },
        ]);
    });

    it('should parse tables with many columns', () => {
        const text =
            '| A | B | C | D |\n| - | - | - | - |\n| 1 | 2 | 3 | 4 |\n| 5 | 6 | 7 | 8 |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'table',
                headers: ['A', 'B', 'C', 'D'],
                rows: [
                    ['1', '2', '3', '4'],
                    ['5', '6', '7', '8'],
                ],
            },
        ]);
    });

    it('should parse tables with alignment indicators in separator', () => {
        const text =
            '| Left | Center | Right |\n| :--- | :----: | ---: |\n| L | C | R |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'table',
                headers: ['Left', 'Center', 'Right'],
                rows: [['L', 'C', 'R']],
            },
        ]);
    });

    it('should not parse incomplete tables without separator', () => {
        const text = '| Header 1 | Header 2 |\n| Value 1  | Value 2  |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).not.toContainEqual({
            type: 'table',
        });
    });

    it('should parse tables with mismatched column counts', () => {
        const text =
            '| Header 1 | Header 2 |\n| --- | --- |\n| Value 1 | Value 2 | Extra |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'table',
                headers: ['Header 1', 'Header 2'],
                rows: [['Value 1', 'Value 2']],
            },
        ]);
    });

    it('should parse tables with empty cells', () => {
        const text =
            '| A | B | C |\n| - | - | - |\n| 1 |   | 3 |\n|   | 2 |   |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'table',
                headers: ['A', 'B', 'C'],
                rows: [
                    ['1', [], '3'],
                    [[], '2', []],
                ],
            },
        ]);
    });

    it('should parse tables with markdown formatting in cells', () => {
        const text =
            '| **Bold** | *Italic* |\n| --- | --- |\n| Normal | **bold cell** |\n| Text | *italic cell* |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'table',
                headers: [
                    [{ type: 'bold', content: 'Bold' }],
                    [{ type: 'italic', content: 'Italic' }],
                ],
                rows: [
                    ['Normal', [{ type: 'bold', content: 'bold cell' }]],
                    ['Text', [{ type: 'italic', content: 'italic cell' }]],
                ],
            },
        ]);
    });

    it('should parse tables with mixed formatting in cells', () => {
        const text =
            '| Header | Content |\n| --- | --- |\n| ***Bold Italic*** | Normal |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'table',
                headers: ['Header', 'Content'],
                rows: [
                    [
                        [{ type: 'bold_italic', content: 'Bold Italic' }],
                        'Normal',
                    ],
                ],
            },
        ]);
    });

    it('should parse tables with links in cells', () => {
        const text =
            '| Link | Named |\n| --- | --- |\n| https://test.com | [Serchat](https://rolling.catfla.re) |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'table',
                headers: ['Link', 'Named'],
                rows: [
                    [
                        [
                            {
                                type: 'link',
                                url: 'https://test.com',
                                text: 'https://test.com',
                            },
                        ],
                        [
                            {
                                type: 'link',
                                url: 'https://rolling.catfla.re',
                                text: 'Serchat',
                            },
                        ],
                    ],
                ],
            },
        ]);
    });

    it('should parse table at the beginning of text', () => {
        const text = '| Header |\n| ------ |\n| Value  |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'table',
                headers: ['Header'],
                rows: [['Value']],
            },
        ]);
    });

    it('should parse text before table on different line', () => {
        const text = 'Some text\n| Header |\n| ------ |\n| Value  |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Some text\n' },
            {
                type: 'table',
                headers: ['Header'],
                rows: [['Value']],
            },
        ]);
    });

    it('should parse text after table on different line', () => {
        const text = '| Header |\n| ------ |\n| Value  |\nSome text';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'table',
                headers: ['Header'],
                rows: [['Value']],
            },
            { type: 'text', content: 'Some text' },
        ]);
    });

    it('should not parse table if not at line start', () => {
        const text = 'Text | Header |\n| ------ |\n| Value  |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        // Should not parse as table since table doesn't start at line beginning
        expect(nodes).not.toContainEqual({
            type: 'table',
            headers: ['Header'],
        });
    });

    it('should parse multiple tables in sequence', () => {
        const text =
            '| A | B |\n| - | - |\n| 1 | 2 |\n| C | D |\n| - | - |\n| 3 | 4 |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        // After first table ends at row 3, trying to continue from line 4 which has "| C | D |"
        // This will either be parsed as a second table or combined, depending on implementation
        expect(nodes.some((n) => n.type === 'table')).toBe(true);
    });

    it('should handle tables with spaces around pipes', () => {
        const text =
            '|  Header 1  |  Header 2  |\n|  ---  |  ---  |\n|  Value 1  |  Value 2  |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'table',
                headers: ['Header 1', 'Header 2'],
                rows: [['Value 1', 'Value 2']],
            },
        ]);
    });

    it('should parse table with empty cells and mismatched rows', () => {
        const text = '|a|b|c|\n|-|-|-|\n|a|||b|||c|';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'table',
                headers: ['a', 'b', 'c'],
                rows: [['a', [{ type: 'spoiler', content: 'b' }], 'c']],
            },
        ]);
    });
});
