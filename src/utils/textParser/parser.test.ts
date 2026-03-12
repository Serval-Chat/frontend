import { describe, expect, it } from 'vitest';

import { ParserPresets, parseText } from './parser';
import type { AdmonitionNode } from './types';

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
            { type: 'h2', content: 'Heading 2' },
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
    it('should parse channel links from rolling.catfla.re', () => {
        const text =
            'Check this channel: https://rolling.catfla.re/chat/@server/6911caf7eefdd0a9fe8160e5/channel/692c89c811f314d2aea864d1';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Check this channel: ' },
            {
                type: 'channel_link',
                serverId: '6911caf7eefdd0a9fe8160e5',
                channelId: '692c89c811f314d2aea864d1',
                url: 'https://rolling.catfla.re/chat/@server/6911caf7eefdd0a9fe8160e5/channel/692c89c811f314d2aea864d1',
            },
        ]);
    });

    it('should parse channel links from catfla.re', () => {
        const text =
            'https://catfla.re/chat/@server/serverId123/channel/channelId456';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'channel_link',
                serverId: 'serverId123',
                channelId: 'channelId456',
                url: 'https://catfla.re/chat/@server/serverId123/channel/channelId456',
            },
        ]);
    });

    it('should parse channel links from localhost', () => {
        const text =
            'http://localhost:5173/chat/@server/serverId/channel/channelId';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'channel_link',
                serverId: 'serverId',
                channelId: 'channelId',
                url: 'http://localhost:5173/chat/@server/serverId/channel/channelId',
            },
        ]);
    });

    it('should parse channel links from localhost:8001', () => {
        const text =
            'http://localhost:8001/chat/@server/serverId/channel/channelId';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'channel_link',
                serverId: 'serverId',
                channelId: 'channelId',
                url: 'http://localhost:8001/chat/@server/serverId/channel/channelId',
            },
        ]);
    });

    it('should parse message links with messageId from localhost:5173', () => {
        const text =
            'http://localhost:5173/chat/@server/6911caf7eefdd0a9fe8160e5/channel/695a948fc14c479df60a50a0/message/695b916b70e8c8265d45a4b9';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'channel_link',
                serverId: '6911caf7eefdd0a9fe8160e5',
                channelId: '695a948fc14c479df60a50a0',
                url: 'http://localhost:5173/chat/@server/6911caf7eefdd0a9fe8160e5/channel/695a948fc14c479df60a50a0/message/695b916b70e8c8265d45a4b9',
                messageId: '695b916b70e8c8265d45a4b9',
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

    it('should parse inline LaTeX with $$...$$', () => {
        const text = 'The formula $$E = mc^2$$ is famous';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'The formula ' },
            { type: 'inline_latex', content: 'E = mc^2' },
            { type: 'text', content: ' is famous' },
        ]);
    });

    it('should parse display LaTeX with $\\n...\\n$', () => {
        const text = '$\nE = mc^2\n$';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'latex', content: 'E = mc^2' }]);
    });

    it('should parse multiline display LaTeX', () => {
        const text = '$\n\\frac{a}{b}\n+ c\n$';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'latex', content: '\\frac{a}{b}\n+ c' },
        ]);
    });

    it('should not parse $$ as display LaTeX when content has no newline after opening', () => {
        const text = '$$x$$';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'inline_latex', content: 'x' }]);
    });

    it('should not parse unclosed inline LaTeX as latex node', () => {
        const text = '$$unclosed';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'text', content: '$$unclosed' }]);
    });

    it('should not parse $ without newline as display LaTeX', () => {
        const text = '$E = mc^2$';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        // Single $ not followed by newline should not parse as latex
        expect(nodes).not.toContainEqual({
            type: 'latex',
            content: 'E = mc^2',
        });
        expect(nodes).not.toContainEqual({
            type: 'inline_latex',
            content: 'E = mc^2',
        });
    });

    it('should handle escaped markdown characters like \\* and \\|', () => {
        const text = 'Hello \\*not bold\\* and \\|\\|not spoiler\\|\\|';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'text', content: '*' },
            { type: 'text', content: 'not bold' },
            { type: 'text', content: '*' },
            { type: 'text', content: ' and ' },
            { type: 'text', content: '|' },
            { type: 'text', content: '|' },
            { type: 'text', content: 'not spoiler' },
            { type: 'text', content: '|' },
            { type: 'text', content: '|' },
        ]);
    });

    it('should handle escaped markdown characters like \\` and \\\\', () => {
        const text = 'Escaped \\`code\\` and backslash \\\\';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Escaped ' },
            { type: 'text', content: '`' },
            { type: 'text', content: 'code' },
            { type: 'text', content: '`' },
            { type: 'text', content: ' and backslash ' },
            { type: 'text', content: '\\' },
        ]);
    });

    it('should parse thematic breaks', () => {
        const text = 'Above\n---\nBelow';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Above\n' },
            { type: 'thematic_break' },
            { type: 'text', content: 'Below' },
        ]);
    });

    it('should parse thematic breaks with trailing spaces', () => {
        const text = '---   \nNext line';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'thematic_break' },
            { type: 'text', content: 'Next line' },
        ]);
    });

    it('should not parse thematic breaks with more or fewer than 3 dashes', () => {
        const text1 = '----\nLine';
        const nodes1 = parseText(text1, ParserPresets.MESSAGE);
        expect(nodes1.some((n) => n.type === 'thematic_break')).toBe(false);

        const text2 = '--\nLine';
        const nodes2 = parseText(text2, ParserPresets.MESSAGE);
        expect(nodes2.some((n) => n.type === 'thematic_break')).toBe(false);
    });

    it('should not parse thematic breaks not at the start of a line', () => {
        const text = 'Text ---';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'text', content: 'Text ---' }]);
    });

    it('should parse underline text', () => {
        const text = 'Hello __underline__ world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'underline', content: 'underline' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse strikethrough text', () => {
        const text = 'Hello ~~strikethrough~~ world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'strikethrough', content: 'strikethrough' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse complex nested formatting with underline and strikethrough', () => {
        const text =
            'This is **bold and ~~strikethrough and __underlined__~~**';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'This is ' },
            {
                type: 'bold',
                content: [
                    { type: 'text', content: 'bold and ' },
                    {
                        type: 'strikethrough',
                        content: [
                            { type: 'text', content: 'strikethrough and ' },
                            { type: 'underline', content: 'underlined' },
                        ],
                    },
                ],
            },
        ]);
    });

    it('should parse single-line blockquote', () => {
        const text = '> This is a quote';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'blockquote',
                content: 'This is a quote',
                multiline: false,
            },
        ]);
    });

    it('should parse single-line blockquote with nested formatting', () => {
        const text = '> Quote with **bold**';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'blockquote',
                content: [
                    { type: 'text', content: 'Quote with ' },
                    { type: 'bold', content: 'bold' },
                ],
                multiline: false,
            },
        ]);
    });

    it('should parse multi-line blockquote', () => {
        const text = '>>> This is a\nmulti-line\nquote';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'blockquote',
                content: 'This is a\nmulti-line\nquote',
                multiline: true,
            },
        ]);
    });

    it('should not parse blockquote if not at start of line', () => {
        const text = 'Not a > quote';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'text', content: 'Not a > quote' }]);
    });

    it('should handle escaped blockquote', () => {
        const text = '\\> Not a quote';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: '>' },
            { type: 'text', content: ' Not a quote' },
        ]);
    });

    it('should group consecutive blockquote lines', () => {
        const text = '> Line 1\n> Line 2';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'blockquote',
                content: 'Line 1\nLine 2',
                multiline: false,
            },
        ]);
    });

    it('should parse nested blockquotes', () => {
        const text = '> level 1\n> > level 2';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'blockquote',
                content: [
                    { type: 'text', content: 'level 1\n' },
                    {
                        type: 'blockquote',
                        content: 'level 2',
                        multiline: false,
                    },
                ],
                multiline: false,
            },
        ]);
    });

    it('should handle mixed nesting with no spaces', () => {
        const text = '>>level 2';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'blockquote',
                content: [
                    {
                        type: 'blockquote',
                        content: 'level 2',
                        multiline: false,
                    },
                ],
                multiline: false,
            },
        ]);
    });
    // ─── GitHub Admonitions ───────────────────────────────────────────────────────

    it('should parse GitHub-style NOTE admonition', () => {
        const text = '> [!NOTE]\n> This is a note.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'github',
                admonitionType: 'note',
                title: undefined,
                collapsible: undefined,
                defaultOpen: undefined,
                content: 'This is a note.',
            },
        ]);
    });

    it('should parse GitHub-style TIP admonition', () => {
        const text = '> [!TIP]\n> This is a tip.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'github',
                admonitionType: 'tip',
                title: undefined,
                collapsible: undefined,
                defaultOpen: undefined,
                content: 'This is a tip.',
            },
        ]);
    });

    it('should parse GitHub-style IMPORTANT admonition', () => {
        const text = '> [!IMPORTANT]\n> This is important.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'github',
                admonitionType: 'important',
                title: undefined,
                collapsible: undefined,
                defaultOpen: undefined,
                content: 'This is important.',
            },
        ]);
    });

    it('should parse GitHub-style WARNING admonition', () => {
        const text = '> [!WARNING]\n> This is a warning.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'github',
                admonitionType: 'warning',
                title: undefined,
                collapsible: undefined,
                defaultOpen: undefined,
                content: 'This is a warning.',
            },
        ]);
    });

    it('should parse GitHub-style CAUTION admonition', () => {
        const text = '> [!CAUTION]\n> This is a caution.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'github',
                admonitionType: 'caution',
                title: undefined,
                collapsible: undefined,
                defaultOpen: undefined,
                content: 'This is a caution.',
            },
        ]);
    });

    it('should parse GitHub-style admonition case-insensitively', () => {
        const text = '> [!warning]\n> Be careful.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'github',
                admonitionType: 'warning',
                title: undefined,
                collapsible: undefined,
                defaultOpen: undefined,
                content: 'Be careful.',
            },
        ]);
    });

    it('should parse GitHub-style admonition with multi-line body', () => {
        const text = '> [!CAUTION]\n> Line 1\n> Line 2';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'github',
                admonitionType: 'caution',
                title: undefined,
                collapsible: undefined,
                defaultOpen: undefined,
                content: 'Line 1\nLine 2',
            },
        ]);
    });

    it('should parse all GitHub admonition types', () => {
        for (const t of ['note', 'tip', 'important', 'warning', 'caution']) {
            const text = `> [!${t.toUpperCase()}]\n> Body`;
            const nodes = parseText(text, ParserPresets.MESSAGE);
            expect(nodes[0].type).toBe('admonition');
            expect(nodes[0].style).toBe('github');
            expect((nodes[0] as AdmonitionNode).admonitionType).toBe(t);
        }
    });

    it('should fall back to blockquote for unknown GitHub-style type', () => {
        const text = '> [!CUSTOMTYPE]\n> Content';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'blockquote',
                content: '[!CUSTOMTYPE]\nContent',
                multiline: false,
            },
        ]);
    });

    it('should parse GitHub admonition body with inline bold formatting', () => {
        const text = '> [!WARNING]\n> This is **bold** text.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'github',
                admonitionType: 'warning',
                title: undefined,
                collapsible: undefined,
                defaultOpen: undefined,
                content: [
                    { type: 'text', content: 'This is ' },
                    { type: 'bold', content: 'bold' },
                    { type: 'text', content: ' text.' },
                ],
            },
        ]);
    });

    it('should parse GitHub admonition body with inline italic formatting', () => {
        const text = '> [!NOTE]\n> This is *italic* text.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'github',
            admonitionType: 'note',
        });
        const content = nodes[0].content as unknown[];
        expect(content).toContainEqual({ type: 'italic', content: 'italic' });
    });

    it('should parse GitHub admonition body with inline code', () => {
        const text = '> [!TIP]\n> Use `code` here.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'github',
            admonitionType: 'tip',
        });
        const content = nodes[0].content as unknown[];
        expect(content).toContainEqual({
            type: 'inline_code',
            content: 'code',
        });
    });

    it('should not parse GitHub admonition without leading blockquote marker', () => {
        const text = '[!NOTE]\nThis is a note.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes.some((n) => n.type === 'admonition')).toBe(false);
    });

    it('should not parse GitHub admonition with missing body line marker', () => {
        const text = '> [!NOTE]\nThis is a note without the > prefix.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes.some((n) => n.type === 'admonition')).toBe(false);
    });

    it('should parse GitHub admonition with empty body', () => {
        const text = '> [!NOTE]\n> ';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'github',
            admonitionType: 'note',
            content: '',
        });
    });

    // ─── Obsidian Admonitions ─────────────────────────────────────────────────────

    it('should parse Obsidian-style NOTE admonition with no title', () => {
        const text = '> [!note]\n> This is a note.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'github',
                admonitionType: 'note',
                title: undefined,
                collapsible: undefined,
                defaultOpen: undefined,
                content: 'This is a note.',
            },
        ]);
    });

    it('should parse Obsidian-style admonition with custom title', () => {
        const text = '> [!warning] Watch Out\n> Content here.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'obsidian',
                admonitionType: 'warning',
                title: 'Watch Out',
                collapsible: undefined,
                defaultOpen: undefined,
                content: 'Content here.',
            },
        ]);
    });

    it('should parse Obsidian collapsible admonition expanded (+)', () => {
        const text = '> [!tip]+ Helpful Tip\n> Body text.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'obsidian',
                admonitionType: 'tip',
                title: 'Helpful Tip',
                collapsible: true,
                defaultOpen: true,
                content: 'Body text.',
            },
        ]);
    });

    it('should parse Obsidian collapsible admonition collapsed (-)', () => {
        const text = '> [!danger]-\n> Hidden content.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'obsidian',
                admonitionType: 'danger',
                title: undefined,
                collapsible: true,
                defaultOpen: false,
                content: 'Hidden content.',
            },
        ]);
    });

    it('should parse Obsidian collapsible admonition collapsed (-) with title', () => {
        const text = '> [!warning]- Collapsible Warning\n> Hidden content.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'obsidian',
                admonitionType: 'warning',
                title: 'Collapsible Warning',
                collapsible: true,
                defaultOpen: false,
                content: 'Hidden content.',
            },
        ]);
    });

    it('should parse Obsidian collapsible admonition expanded (+) with no title', () => {
        const text = '> [!note]+\n> Visible by default.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'obsidian',
                admonitionType: 'note',
                title: undefined,
                collapsible: true,
                defaultOpen: true,
                content: 'Visible by default.',
            },
        ]);
    });

    it('should parse known Obsidian type without fold or title as Obsidian admonition', () => {
        const text = '> [!info]\n> Just info.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'obsidian',
            admonitionType: 'info',
            content: 'Just info.',
        });
    });

    it('should parse bug type as Obsidian admonition', () => {
        const text = '> [!bug]\n> a';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'obsidian',
            admonitionType: 'bug',
            content: 'a',
        });
    });

    it('should render unknown Obsidian type as generic admonition when fold modifier present', () => {
        const text = '> [!custom]+ Expanded\n> Content.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'obsidian',
                admonitionType: 'custom',
                title: 'Expanded',
                collapsible: true,
                defaultOpen: true,
                content: 'Content.',
            },
        ]);
    });

    it('should parse Obsidian admonition with multi-line body', () => {
        const text = '> [!warning]\n> Line 1\n> Line 2';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'github',
            admonitionType: 'warning',
            content: 'Line 1\nLine 2',
        });
    });

    it('should parse Obsidian admonition case-insensitively', () => {
        const text = '> [!WARNING]\n> A warning.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            admonitionType: 'warning',
        });
    });

    it('should parse all Obsidian admonition types', () => {
        for (const t of [
            'note',
            'tip',
            'important',
            'warning',
            'caution',
            'danger',
            'error',
            'hint',
        ]) {
            const text = `> [!${t}]+\n> Body`;
            const nodes = parseText(text, ParserPresets.MESSAGE);
            expect(nodes[0]).toMatchObject({
                type: 'admonition',
                style: 'obsidian',
                admonitionType: t,
            });
        }
    });

    it('should parse Obsidian admonition with empty body', () => {
        const text = '> [!note]\n> ';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'github',
            admonitionType: 'note',
            content: '',
        });
    });

    it('should parse MyST-style NOTE admonition', () => {
        const text = ':::{note}\nA simple note.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'myst',
                admonitionType: 'note',
                title: undefined,
                content: 'A simple note.',
            },
        ]);
    });

    it('should parse MyST-style TIP admonition', () => {
        const text = ':::{tip}\nA helpful tip.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'myst',
                admonitionType: 'tip',
                title: undefined,
                content: 'A helpful tip.',
            },
        ]);
    });

    it('should parse MyST-style IMPORTANT admonition', () => {
        const text = ':::{important}\nThis is important.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'myst',
                admonitionType: 'important',
                title: undefined,
                content: 'This is important.',
            },
        ]);
    });

    it('should parse MyST-style WARNING admonition', () => {
        const text = ':::{warning}\nThis is a warning.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'myst',
                admonitionType: 'warning',
                title: undefined,
                content: 'This is a warning.',
            },
        ]);
    });

    it('should parse MyST-style CAUTION admonition', () => {
        const text = ':::{caution}\nThis is a caution.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'myst',
                admonitionType: 'caution',
                title: undefined,
                content: 'This is a caution.',
            },
        ]);
    });

    it('should parse MyST-style DANGER admonition', () => {
        const text = ':::{danger}\nThis is danger.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'myst',
                admonitionType: 'danger',
                title: undefined,
                content: 'This is danger.',
            },
        ]);
    });

    it('should parse MyST-style ERROR admonition', () => {
        const text = ':::{error}\nThis is an error.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'myst',
                admonitionType: 'error',
                title: undefined,
                content: 'This is an error.',
            },
        ]);
    });

    it('should parse MyST-style HINT admonition', () => {
        const text = ':::{hint}\nThis is a hint.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'myst',
                admonitionType: 'hint',
                title: undefined,
                content: 'This is a hint.',
            },
        ]);
    });

    it('should parse MyST-style SEEALSO admonition', () => {
        const text = ':::{seealso}\nSee also this.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'myst',
                admonitionType: 'seealso',
                title: undefined,
                content: 'See also this.',
            },
        ]);
    });

    it('should parse MyST admonition with custom title', () => {
        const text = ':::{warning} Watch Out\nDanger ahead.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'myst',
                admonitionType: 'warning',
                title: 'Watch Out',
                content: 'Danger ahead.',
            },
        ]);
    });

    it('should parse MyST admonition with case-insensitive type', () => {
        const text = ':::{WARNING}\nA warning.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'myst',
            admonitionType: 'warning',
        });
    });

    it('should parse MyST admonition with multi-paragraph body', () => {
        const text = ':::{danger}\nFirst paragraph.\n\nSecond paragraph.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'myst',
            admonitionType: 'danger',
        });
        const content = (nodes[0] as { content: unknown }).content;
        expect(content).toBeDefined();
    });

    it('should parse MyST admonition with multi-line body', () => {
        const text = ':::{warning}\nLine 1\nLine 2\nLine 3\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'myst',
            admonitionType: 'warning',
        });
        const content = nodes[0].content as string;
        expect(content).toContain('Line 1');
        expect(content).toContain('Line 2');
        expect(content).toContain('Line 3');
    });

    it('should parse MyST admonition followed by normal text', () => {
        const text = ':::{note}\nNote body.\n:::\nAfter text';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({ type: 'admonition', style: 'myst' });
        expect(nodes[1]).toMatchObject({
            type: 'text',
            content: 'After text',
        });
    });

    it('should parse MyST admonition preceded by normal text', () => {
        const text = 'Before text\n:::{note}\nNote body.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'text',
            content: 'Before text',
        });
        expect(nodes[1]).toMatchObject({ type: 'admonition', style: 'myst' });
    });

    it('should not parse MyST admonition if not at start of line', () => {
        const text = 'Some text :::{note}\nBody\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes.some((n) => n.type === 'admonition')).toBe(false);
    });

    it('should not parse unclosed MyST admonition', () => {
        const text = ':::{note}\nBody without closing fence';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes.some((n) => n.type === 'admonition')).toBe(false);
    });

    it('should parse unknown MyST type as generic admonition', () => {
        const text = ':::{customtype}\nContent.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'admonition',
                style: 'myst',
                admonitionType: 'customtype',
                title: undefined,
                content: 'Content.',
            },
        ]);
    });

    it('should parse MyST admonition with empty body', () => {
        const text = ':::{note}\n\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'myst',
            admonitionType: 'note',
        });
    });

    it('should parse all MyST admonition types', () => {
        for (const t of [
            'note',
            'tip',
            'important',
            'warning',
            'caution',
            'danger',
            'error',
            'hint',
            'seealso',
        ]) {
            const text = `:::{${t}}\nBody\n:::`;
            const nodes = parseText(text, ParserPresets.MESSAGE);
            expect(nodes[0]).toMatchObject({
                type: 'admonition',
                style: 'myst',
                admonitionType: t,
            });
        }
    });
});
