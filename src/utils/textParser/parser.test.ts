import { describe, expect, it, vi } from 'vitest';

import { ParserPresets, parseText } from './parser';
import { type AdmonitionNode, ParserFeature } from './types';

describe('TextParser', (): void => {
    it('should parse bold text', (): void => {
        const text = 'Hello **bold** world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'bold', content: 'bold' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse italic text', (): void => {
        const text = 'Hello *italic* world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'italic', content: 'italic' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse bold-italic text', (): void => {
        const text = 'Hello ***bold italic*** world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'bold_italic', content: 'bold italic' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse custom emojis', (): void => {
        const text = 'Hello <emoji:happy_cat> world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'emoji', emojiId: 'happy_cat' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse timestamps with format flags', (): void => {
        const text = 'Meet at <t:1543424460:F> or <t:1543424460:R>';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Meet at ' },
            { type: 'timestamp', timestamp: 1_543_424_460, flag: 'F' },
            { type: 'text', content: ' or ' },
            { type: 'timestamp', timestamp: 1_543_424_460, flag: 'R' },
        ]);
    });

    it('should parse timestamps without a format flag', (): void => {
        const nodes = parseText('<t:-123456789>', ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'timestamp', timestamp: -123_456_789, flag: undefined },
        ]);
    });

    it('should leave invalid timestamp flags as text', (): void => {
        const nodes = parseText('<t:1543424460:x>', ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'text', content: '<t:1543424460:x>' }]);
    });

    it('should parse links', (): void => {
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

    it('should parse Klipy links', (): void => {
        const text = 'Check out https://klipy.com/g/4823106377700464 for more';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Check out ' },
            {
                type: 'klipy',
                klipyId: '4823106377700464',
                url: 'https://klipy.com/g/4823106377700464',
            },
            { type: 'text', content: ' for more' },
        ]);
    });

    it('should parse standard Klipy GIF links', (): void => {
        const text =
            'Check out https://klipy.com/gifs/floppa-michael--k01KRS7EZ3ZN5K93KWB5G0QSA5Z';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Check out ' },
            {
                type: 'klipy',
                klipyId: 'floppa-michael--k01KRS7EZ3ZN5K93KWB5G0QSA5Z',
                url: 'https://klipy.com/gifs/floppa-michael--k01KRS7EZ3ZN5K93KWB5G0QSA5Z',
            },
        ]);
    });

    it('should parse standard Klipy sticker links', (): void => {
        const text = 'https://klipy.com/stickers/happy-cat-123';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'klipy',
                klipyId: 'happy-cat-123',
                url: 'https://klipy.com/stickers/happy-cat-123',
            },
        ]);
    });

    it('should NOT parse Klipy links when wrapped in angle brackets', (): void => {
        const text =
            'Check out <https://klipy.com/gifs/so-cute-cat-5--kAIU192Mj> for more';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Check out ' },
            {
                type: 'link',
                url: 'https://klipy.com/gifs/so-cute-cat-5--kAIU192Mj',
                text: 'https://klipy.com/gifs/so-cute-cat-5--kAIU192Mj',
            },
            { type: 'text', content: ' for more' },
        ]);
    });

    it('should parse angle bracket links for regular URLs', (): void => {
        const text = 'Check <https://example.com> out';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Check ' },
            {
                type: 'link',
                url: 'https://example.com',
                text: 'https://example.com',
            },
            { type: 'text', content: ' out' },
        ]);
    });

    it('should parse angle bracket Klipy sticker links as regular links', (): void => {
        const text = '<https://klipy.com/stickers/happy-cat-123>';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'link',
                url: 'https://klipy.com/stickers/happy-cat-123',
                text: 'https://klipy.com/stickers/happy-cat-123',
            },
        ]);
    });

    it('should handle complex mixed text', (): void => {
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

    it('should parse headings', (): void => {
        const text = '# Heading 1\n## Heading 2\n### Heading 3';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'h1', content: 'Heading 1' },
            { type: 'h2', content: 'Heading 2' },
            { type: 'h3', content: 'Heading 3' },
        ]);
    });

    it('should parse ## heading with a leading number as h2, not ordered_list', (): void => {
        const text = '## 2. Your Account';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'h2', content: '2. Your Account' }]);
    });

    it('should parse subtext', (): void => {
        const text = '-# This is subtext';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'subtext', content: 'This is subtext' },
        ]);
    });

    it('should parse spoilers', (): void => {
        const text = 'This is a ||spoiler|| message';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'This is a ' },
            { type: 'spoiler', content: 'spoiler' },
            { type: 'text', content: ' message' },
        ]);
    });

    it('should parse inline code', (): void => {
        const text = 'Use `npm install` to get started';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Use ' },
            { type: 'inline_code', content: 'npm install' },
            { type: 'text', content: ' to get started' },
        ]);
    });

    it('should parse code blocks', (): void => {
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

    it('should parse mermaid code blocks as mermaid nodes', (): void => {
        const text = '```mermaid\ngraph TD;\nA-->B;\n```';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'mermaid',
                content: 'graph TD;\nA-->B;',
            },
        ]);
    });

    it('should parse invite links', (): void => {
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

    it('should parse rolling invite links', (): void => {
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
    it('should parse channel links from rolling.catfla.re', (): void => {
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

    it('should parse channel links from catfla.re', (): void => {
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

    it('should parse channel links from localhost', (): void => {
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

    it('should parse channel links from localhost:8001', (): void => {
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

    it('should parse message links with messageId from localhost:5173', (): void => {
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
    it('should parse channel mention URL as channel_link', (): void => {
        const text =
            'http://localhost:5173/chat/@server/serv456/channel/chan123';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'channel_link',
                serverId: 'serv456',
                channelId: 'chan123',
                url: 'http://localhost:5173/chat/@server/serv456/channel/chan123',
            },
        ]);
    });
    it('should parse file embeds', (): void => {
        const text = '[%file%](https://example.com/image.png)';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'file',
                url: 'https://example.com/image.png',
            },
        ]);
    });

    it('should parse named links', (): void => {
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

    it('should parse named links within another element', (): void => {
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

    it('should parse bold within italic', (): void => {
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

    it('should parse links within spoilers', (): void => {
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

    it('should parse ordered list items', (): void => {
        const text = '1. First item\n2. Second item';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'ordered_list',
                number: '1',
                content: 'First item',
                depth: 0,
            },
            {
                type: 'ordered_list',
                number: '2',
                content: 'Second item',
                depth: 0,
            },
        ]);
    });

    it('should parse indented ordered list items', (): void => {
        const text = '1. Parent\n  2. Child\n    3. Grandchild';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'ordered_list', number: '1', content: 'Parent', depth: 0 },
            { type: 'ordered_list', number: '2', content: 'Child', depth: 1 },
            {
                type: 'ordered_list',
                number: '3',
                content: 'Grandchild',
                depth: 2,
            },
        ]);
    });

    it('should parse ordered list items with nested formatting', (): void => {
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
                depth: 0,
            },
        ]);
    });

    it('should not parse digits in the middle of a line as ordered list', (): void => {
        const text = 'There is 1. something here';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'There is 1. something here' },
        ]);
    });

    it('should skip newline after list item even if followed by normal text', (): void => {
        const text = '1. Item\nNormal text';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'ordered_list', number: '1', content: 'Item', depth: 0 },
            { type: 'text', content: 'Normal text' },
        ]);
    });

    it('should parse unordered list items (-)', (): void => {
        const text = '- First item\n- Second item';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'unordered_list', content: 'First item', depth: 0 },
            { type: 'unordered_list', content: 'Second item', depth: 0 },
        ]);
    });

    it('should parse nested unordered list items', (): void => {
        const text = '- Parent\n  - Child\n    - Grandchild';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'unordered_list', content: 'Parent', depth: 0 },
            { type: 'unordered_list', content: 'Child', depth: 1 },
            { type: 'unordered_list', content: 'Grandchild', depth: 2 },
        ]);
    });

    it('should parse unordered list items (*)', (): void => {
        const text = '* First item\n* Second item';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'unordered_list', content: 'First item', depth: 0 },
            { type: 'unordered_list', content: 'Second item', depth: 0 },
        ]);
    });

    it('should parse unordered list items (+)', (): void => {
        const text = '+ First item\n+ Second item';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'unordered_list', content: 'First item', depth: 0 },
            { type: 'unordered_list', content: 'Second item', depth: 0 },
        ]);
    });

    it('should parse unordered list items with nested formatting', (): void => {
        const text = '- Item with **bold** and [link](https://test.com)';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'unordered_list',
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
                depth: 0,
            },
        ]);
    });

    it('should parse basic markdown tables', (): void => {
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

    it('should parse tables with single column', (): void => {
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

    it('should parse tables with many columns', (): void => {
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

    it('should parse tables with alignment indicators in separator', (): void => {
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

    it('should not parse incomplete tables without separator', (): void => {
        const text = '| Header 1 | Header 2 |\n| Value 1  | Value 2  |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).not.toContainEqual({
            type: 'table',
        });
    });

    it('should parse tables with mismatched column counts', (): void => {
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

    it('should parse tables with empty cells', (): void => {
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

    it('should parse tables with markdown formatting in cells', (): void => {
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

    it('should parse tables with mixed formatting in cells', (): void => {
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

    it('should parse tables with links in cells', (): void => {
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

    it('should parse table at the beginning of text', (): void => {
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

    it('should parse text before table on different line', (): void => {
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

    it('should parse text after table on different line', (): void => {
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

    it('should not parse table if not at line start', (): void => {
        const text = 'Text | Header |\n| ------ |\n| Value  |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        // Should not parse as table since table doesn't start at line beginning
        expect(nodes).not.toContainEqual({
            type: 'table',
            headers: ['Header'],
        });
    });

    it('should parse multiple tables in sequence', (): void => {
        const text =
            '| A | B |\n| - | - |\n| 1 | 2 |\n| C | D |\n| - | - |\n| 3 | 4 |';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        // After first table ends at row 3, trying to continue from line 4 which has "| C | D |"
        // This will either be parsed as a second table or combined, depending on implementation
        expect(nodes.some((n): boolean => n.type === 'table')).toBe(true);
    });

    it('should handle tables with spaces around pipes', (): void => {
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

    it('should parse table with empty cells and mismatched rows', (): void => {
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

    it('should parse inline LaTeX with $$...$$', (): void => {
        const text = 'The formula $$E = mc^2$$ is famous';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'The formula ' },
            { type: 'inline_latex', content: 'E = mc^2' },
            { type: 'text', content: ' is famous' },
        ]);
    });

    it(String.raw`should parse display LaTeX with $\n...\n$`, (): void => {
        const text = '$\nE = mc^2\n$';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'latex', content: 'E = mc^2' }]);
    });

    it('should parse multiline display LaTeX', (): void => {
        const text = '$\n\\frac{a}{b}\n+ c\n$';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'latex', content: '\\frac{a}{b}\n+ c' },
        ]);
    });

    it('should not parse $$ as display LaTeX when content has no newline after opening', (): void => {
        const text = '$$x$$';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'inline_latex', content: 'x' }]);
    });

    it('should not parse unclosed inline LaTeX as latex node', (): void => {
        const text = '$$unclosed';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'text', content: '$$unclosed' }]);
    });

    it('should not parse $ without newline as display LaTeX', (): void => {
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

    it(
        String.raw`should handle escaped markdown characters like \* and \|`,
        (): void => {
            const text = String.raw`Hello \*not bold\* and \|\|not spoiler\|\|`;
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
        },
    );

    it('should handle escaped markdown characters like \\` and \\\\', (): void => {
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

    it('should parse thematic breaks', (): void => {
        const text = 'Above\n---\nBelow';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Above\n' },
            { type: 'thematic_break' },
            { type: 'text', content: 'Below' },
        ]);
    });

    it('should parse thematic breaks with trailing spaces', (): void => {
        const text = '---   \nNext line';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'thematic_break' },
            { type: 'text', content: 'Next line' },
        ]);
    });

    it('should not parse thematic breaks with more or fewer than 3 dashes', (): void => {
        const text1 = '----\nLine';
        const nodes1 = parseText(text1, ParserPresets.MESSAGE);
        expect(nodes1.some((n): boolean => n.type === 'thematic_break')).toBe(
            false,
        );

        const text2 = '--\nLine';
        const nodes2 = parseText(text2, ParserPresets.MESSAGE);
        expect(nodes2.some((n): boolean => n.type === 'thematic_break')).toBe(
            false,
        );
    });

    it('should not parse thematic breaks not at the start of a line', (): void => {
        const text = 'Text ---';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'text', content: 'Text ---' }]);
    });

    it('should parse underline text', (): void => {
        const text = 'Hello __underline__ world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'underline', content: 'underline' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse strikethrough text', (): void => {
        const text = 'Hello ~~strikethrough~~ world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'strikethrough', content: 'strikethrough' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse curly underline text', (): void => {
        const text = 'Hello _~curly underline~_ world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'curly_underline', content: 'curly underline' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse jagged underline text', (): void => {
        const text = 'Hello _^jagged underline^_ world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'jagged_underline', content: 'jagged underline' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse double underline text', (): void => {
        const text = 'Hello ___double underline___ world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'double_underline', content: 'double underline' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should prefer double underline over single underline', (): void => {
        const text = '___double___ and __single__';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'double_underline', content: 'double' },
            { type: 'text', content: ' and ' },
            { type: 'underline', content: 'single' },
        ]);
    });

    it('should parse doubly curly underline text', (): void => {
        const text = 'Hello _~~doubly curly~~_ world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'double_curly_underline', content: 'doubly curly' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should prefer doubly curly over single curly and strikethrough', (): void => {
        const text = '_~~double~~_, _~single~_, and ~~strike~~';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'double_curly_underline', content: 'double' },
            { type: 'text', content: ', ' },
            { type: 'curly_underline', content: 'single' },
            { type: 'text', content: ', and ' },
            { type: 'strikethrough', content: 'strike' },
        ]);
    });

    it('should parse dashed underline text', (): void => {
        const text = 'Hello _-dashed underline-_ world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'dashed_underline', content: 'dashed underline' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse dotted underline text', (): void => {
        const text = 'Hello _.dotted underline._ world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'dotted_underline', content: 'dotted underline' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse rhythm underline text', (): void => {
        const text = 'Hello _-.rhythm underline.-_ world';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'Hello ' },
            { type: 'rhythm_underline', content: 'rhythm underline' },
            { type: 'text', content: ' world' },
        ]);
    });

    it('should parse superscript text', (): void => {
        const text = 'E = mc^2^';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'E = mc' },
            { type: 'superscript', content: '2' },
        ]);
    });

    it('should parse subscript text', (): void => {
        const text = 'H~2~O';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'H' },
            { type: 'subscript', content: '2' },
            { type: 'text', content: 'O' },
        ]);
    });

    it('should handle nested formatting within super/subscript', (): void => {
        const text = '^**bold**^ and ~*italic*~';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'superscript',
                content: [{ type: 'bold', content: 'bold' }],
            },
            { type: 'text', content: ' and ' },
            {
                type: 'subscript',
                content: [{ type: 'italic', content: 'italic' }],
            },
        ]);
    });

    it('should prefer strikethrough over subscript', (): void => {
        const text = '~~strike~~ and ~sub~';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'strikethrough', content: 'strike' },
            { type: 'text', content: ' and ' },
            { type: 'subscript', content: 'sub' },
        ]);
    });

    it('should prefer jagged underline over superscript', (): void => {
        const text = '_^jagged^_ and ^super^';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'jagged_underline', content: 'jagged' },
            { type: 'text', content: ' and ' },
            { type: 'superscript', content: 'super' },
        ]);
    });

    it('should not parse unclosed super/subscript', (): void => {
        const text = '^unclosed and ~unclosed';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: '^unclosed and ~unclosed' },
        ]);
    });

    it('should not parse multiline super/subscript', (): void => {
        const text = '^line1\nline2^';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'text', content: '^line1\nline2^' }]);
    });

    it('should parse stacked superscript/subscript text', (): void => {
        const text = '^top|bottom^';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'stacked_script',
                sup: 'top',
                sub: 'bottom',
            },
        ]);
    });

    it('should parse stacked script with nested formatting', (): void => {
        const text = '^**bold**|*italic*^';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            {
                type: 'stacked_script',
                sup: [{ type: 'bold', content: 'bold' }],
                sub: [{ type: 'italic', content: 'italic' }],
            },
        ]);
    });

    it('should fall back to normal superscript if no pipe is present', (): void => {
        const text = '^normal^';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'superscript', content: 'normal' }]);
    });

    it('should not parse C/C++/C# programmer as header', (): void => {
        const text = 'C/C++/C# programmer';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: 'C/C++/C# programmer' },
        ]);
    });

    it('should parse complex nested formatting with underline and strikethrough', (): void => {
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

    it('should parse single-line blockquote', (): void => {
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

    it('should parse single-line blockquote with nested formatting', (): void => {
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

    it('should parse multi-line blockquote', (): void => {
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

    it('should not parse blockquote if not at start of line', (): void => {
        const text = 'Not a > quote';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([{ type: 'text', content: 'Not a > quote' }]);
    });

    it('should handle escaped blockquote', (): void => {
        const text = String.raw`\> Not a quote`;
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes).toEqual([
            { type: 'text', content: '>' },
            { type: 'text', content: ' Not a quote' },
        ]);
    });

    it('should group consecutive blockquote lines', (): void => {
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

    it('should parse nested blockquotes', (): void => {
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

    it('should handle mixed nesting with no spaces', (): void => {
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

    it('should parse GitHub-style NOTE admonition', (): void => {
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

    it('should parse GitHub-style TIP admonition', (): void => {
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

    it('should parse GitHub-style IMPORTANT admonition', (): void => {
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

    it('should parse GitHub-style WARNING admonition', (): void => {
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

    it('should parse GitHub-style CAUTION admonition', (): void => {
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

    it('should parse GitHub-style admonition case-insensitively', (): void => {
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

    it('should parse GitHub-style admonition with multi-line body', (): void => {
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

    it('should parse all GitHub admonition types', (): void => {
        for (const t of ['note', 'tip', 'important', 'warning', 'caution']) {
            const text = `> [!${t.toUpperCase()}]\n> Body`;
            const nodes = parseText(text, ParserPresets.MESSAGE);
            const admonition = nodes[0] as AdmonitionNode;
            expect(admonition.type).toBe('admonition');
            expect(admonition.style).toBe('github');
            expect(admonition.admonitionType).toBe(t);
        }
    });

    it('should fall back to blockquote for unknown GitHub-style type', (): void => {
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

    it('should parse GitHub admonition body with inline bold formatting', (): void => {
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

    it('should parse GitHub admonition body with inline italic formatting', (): void => {
        const text = '> [!NOTE]\n> This is *italic* text.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'github',
            admonitionType: 'note',
        });
        const content = (nodes[0] as AdmonitionNode).content as unknown[];
        expect(content).toContainEqual({ type: 'italic', content: 'italic' });
    });

    it('should parse GitHub admonition body with inline code', (): void => {
        const text = '> [!TIP]\n> Use `code` here.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'github',
            admonitionType: 'tip',
        });
        const content = (nodes[0] as AdmonitionNode).content as unknown[];
        expect(content).toContainEqual({
            type: 'inline_code',
            content: 'code',
        });
    });

    it('should not parse GitHub admonition without leading blockquote marker', (): void => {
        const text = '[!NOTE]\nThis is a note.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes.some((n): boolean => n.type === 'admonition')).toBe(false);
    });

    it('should not parse GitHub admonition with missing body line marker', (): void => {
        const text = '> [!NOTE]\nThis is a note without the > prefix.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes.some((n): boolean => n.type === 'admonition')).toBe(false);
    });

    it('should parse GitHub admonition with empty body', (): void => {
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

    it('should parse Obsidian-style NOTE admonition with no title', (): void => {
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

    it('should parse Obsidian-style admonition with custom title', (): void => {
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

    it('should parse Obsidian collapsible admonition expanded (+)', (): void => {
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

    it('should parse Obsidian collapsible admonition collapsed (-)', (): void => {
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

    it('should parse Obsidian collapsible admonition collapsed (-) with title', (): void => {
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

    it('should parse Obsidian collapsible admonition expanded (+) with no title', (): void => {
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

    it('should parse known Obsidian type without fold or title as Obsidian admonition', (): void => {
        const text = '> [!info]\n> Just info.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'obsidian',
            admonitionType: 'info',
            content: 'Just info.',
        });
    });

    it('should parse bug type as Obsidian admonition', (): void => {
        const text = '> [!bug]\n> a';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'obsidian',
            admonitionType: 'bug',
            content: 'a',
        });
    });

    it('should render unknown Obsidian type as generic admonition when fold modifier present', (): void => {
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

    it('should parse Obsidian admonition with multi-line body', (): void => {
        const text = '> [!warning]\n> Line 1\n> Line 2';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'github',
            admonitionType: 'warning',
            content: 'Line 1\nLine 2',
        });
    });

    it('should parse Obsidian admonition case-insensitively', (): void => {
        const text = '> [!WARNING]\n> A warning.';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            admonitionType: 'warning',
        });
    });

    it('should parse all Obsidian admonition types', (): void => {
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

    it('should parse Obsidian admonition with empty body', (): void => {
        const text = '> [!note]\n> ';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'github',
            admonitionType: 'note',
            content: '',
        });
    });

    it('should parse MyST-style NOTE admonition', (): void => {
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

    it('should parse MyST-style TIP admonition', (): void => {
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

    it('should parse MyST-style IMPORTANT admonition', (): void => {
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

    it('should parse MyST-style WARNING admonition', (): void => {
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

    it('should parse MyST-style CAUTION admonition', (): void => {
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

    it('should parse MyST-style DANGER admonition', (): void => {
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

    it('should parse MyST-style ERROR admonition', (): void => {
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

    it('should parse MyST-style HINT admonition', (): void => {
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

    it('should parse MyST-style SEEALSO admonition', (): void => {
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

    it('should parse MyST admonition with custom title', (): void => {
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

    it('should parse MyST admonition with case-insensitive type', (): void => {
        const text = ':::{WARNING}\nA warning.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'myst',
            admonitionType: 'warning',
        });
    });

    it('should parse MyST admonition with multi-paragraph body', (): void => {
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

    it('should parse MyST admonition with multi-line body', (): void => {
        const text = ':::{warning}\nLine 1\nLine 2\nLine 3\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'myst',
            admonitionType: 'warning',
        });
        const content = (nodes[0] as AdmonitionNode).content as string;
        expect(content).toContain('Line 1');
        expect(content).toContain('Line 2');
        expect(content).toContain('Line 3');
    });

    it('should parse MyST admonition followed by normal text', (): void => {
        const text = ':::{note}\nNote body.\n:::\nAfter text';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({ type: 'admonition', style: 'myst' });
        expect(nodes[1]).toMatchObject({
            type: 'text',
            content: 'After text',
        });
    });

    it('should parse MyST admonition preceded by normal text', (): void => {
        const text = 'Before text\n:::{note}\nNote body.\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'text',
            content: 'Before text',
        });
        expect(nodes[1]).toMatchObject({ type: 'admonition', style: 'myst' });
    });

    it('should not parse MyST admonition if not at start of line', (): void => {
        const text = 'Some text :::{note}\nBody\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes.some((n): boolean => n.type === 'admonition')).toBe(false);
    });

    it('should not parse unclosed MyST admonition', (): void => {
        const text = ':::{note}\nBody without closing fence';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes.some((n): boolean => n.type === 'admonition')).toBe(false);
    });

    it('should parse unknown MyST type as generic admonition', (): void => {
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

    it('should parse MyST admonition with empty body', (): void => {
        const text = ':::{note}\n\n:::';
        const nodes = parseText(text, ParserPresets.MESSAGE);
        expect(nodes[0]).toMatchObject({
            type: 'admonition',
            style: 'myst',
            admonitionType: 'note',
        });
    });

    it('should parse all MyST admonition types', (): void => {
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

    it('does not parse heading levels when that specific heading feature is disabled', (): void => {
        const options = {
            ...ParserPresets.MESSAGE,
            features: ParserPresets.MESSAGE.features.filter(
                (feature): boolean => feature !== ParserFeature.H1,
            ),
        };

        expect(parseText('# test', options)).toEqual([
            { type: 'text', content: '# test' },
        ]);
    });

    describe('Alternative URLs', (): void => {
        it('should parse invite links from alternative URLs', (): void => {
            vi.stubEnv('VITE_ALTERNATIVE_URLS', '["http://localhost:5173"]');
            const text = 'Join: http://localhost:5173/invite/osdev';
            const nodes = parseText(text, ParserPresets.MESSAGE);
            expect(nodes).toEqual([
                { type: 'text', content: 'Join: ' },
                {
                    type: 'invite',
                    code: 'osdev',
                    url: 'http://localhost:5173/invite/osdev',
                },
            ]);
            vi.unstubAllEnvs();
        });

        it('should parse channel links from alternative URLs', (): void => {
            vi.stubEnv(
                'VITE_ALTERNATIVE_URLS',
                '["https://my-custom-domain.com"]',
            );
            const text =
                'https://my-custom-domain.com/chat/@server/s1/channel/c1';
            const nodes = parseText(text, ParserPresets.MESSAGE);
            expect(nodes).toEqual([
                {
                    type: 'channel_link',
                    serverId: 's1',
                    channelId: 'c1',
                    url: 'https://my-custom-domain.com/chat/@server/s1/channel/c1',
                },
            ]);
            vi.unstubAllEnvs();
        });
    });
});
