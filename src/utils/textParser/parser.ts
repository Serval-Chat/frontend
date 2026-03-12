import { emojiRegex } from '@/utils/emoji';

import {
    type ASTNode,
    ParserFeature,
    type ParserFeature as ParserFeatureType,
} from './types';

export interface ParserOptions {
    readonly features: readonly ParserFeatureType[];
}

export const ParserPresets = {
    MESSAGE: {
        features: [
            ParserFeature.BOLD,
            ParserFeature.ITALIC,
            ParserFeature.BOLD_ITALIC,
            ParserFeature.EMOJI,
            ParserFeature.UNICODE_EMOJI,
            ParserFeature.LINK,
            ParserFeature.H1,
            ParserFeature.H2,
            ParserFeature.H3,
            ParserFeature.SUBTEXT,
            ParserFeature.SPOILER,
            ParserFeature.INLINE_CODE,
            ParserFeature.CODE_BLOCK,
            ParserFeature.INVITE,
            ParserFeature.FILE,
            ParserFeature.MENTION,
            ParserFeature.ROLE_MENTION,
            ParserFeature.EVERYONE_MENTION,
            ParserFeature.CHANNEL_LINK,
            ParserFeature.ORDERED_LIST,
            ParserFeature.TABLE,
            ParserFeature.LATEX,
            ParserFeature.INLINE_LATEX,
            ParserFeature.THEMATIC_BREAK,
            ParserFeature.UNDERLINE,
            ParserFeature.STRIKETHROUGH,
            ParserFeature.BLOCKQUOTE,
            ParserFeature.ADMONITION,
            ParserFeature.MERMAID,
            ParserFeature.UNORDERED_LIST,
        ],
    },
    BIO: {
        features: [
            ParserFeature.BOLD,
            ParserFeature.ITALIC,
            ParserFeature.BOLD_ITALIC,
            ParserFeature.EMOJI,
            ParserFeature.UNICODE_EMOJI,
            ParserFeature.LINK,
            ParserFeature.H1,
            ParserFeature.H2,
            ParserFeature.H3,
            ParserFeature.SUBTEXT,
            ParserFeature.SPOILER,
            ParserFeature.INLINE_CODE,
            ParserFeature.CODE_BLOCK,
            ParserFeature.INVITE,
            ParserFeature.FILE,
            ParserFeature.MENTION,
            ParserFeature.ROLE_MENTION,
            ParserFeature.EVERYONE_MENTION,
            ParserFeature.CHANNEL_LINK,
            ParserFeature.ORDERED_LIST,
            ParserFeature.TABLE,
            ParserFeature.LATEX,
            ParserFeature.INLINE_LATEX,
            ParserFeature.THEMATIC_BREAK,
            ParserFeature.UNDERLINE,
            ParserFeature.STRIKETHROUGH,
            ParserFeature.BLOCKQUOTE,
            ParserFeature.ADMONITION,
            ParserFeature.MERMAID,
            ParserFeature.UNORDERED_LIST,
        ],
    },
} as const;

export class TextParser {
    private text: string;
    private index: number = 0;
    private options: ParserOptions;
    private startsWithEmojiRegex: RegExp;

    constructor(text: string, options: ParserOptions) {
        this.text = text;
        this.options = options;
        this.startsWithEmojiRegex = new RegExp('^' + emojiRegex.source);
    }

    public parse(): ASTNode[] {
        const nodes: ASTNode[] = [];
        let currentText = '';

        while (this.index < this.text.length) {
            const char = this.text[this.index];
            const charCode = char.charCodeAt(0);

            if (char === '\\' && this.index + 1 < this.text.length) {
                if (currentText) {
                    nodes.push({ type: 'text', content: currentText });
                    currentText = '';
                }

                const escapedChar = this.text[this.index + 1];

                nodes.push({ type: 'text', content: escapedChar });

                this.index += 2;
                continue;
            }

            // Unicode Emoji
            if (
                charCode > 127 &&
                this.options.features.includes(ParserFeature.UNICODE_EMOJI)
            ) {
                const emojiNode = this.tryParseUnicodeEmoji();
                if (emojiNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(emojiNode);
                    continue;
                }
            }

            // [%file%](url) or [label](url)
            if (
                char === '[' &&
                this.options.features.includes(ParserFeature.LINK)
            ) {
                if (
                    this.options.features.includes(ParserFeature.FILE) &&
                    this.peek('[%file%]')
                ) {
                    const fileNode = this.tryParseFile();
                    if (fileNode) {
                        if (currentText) {
                            nodes.push({ type: 'text', content: currentText });
                            currentText = '';
                        }
                        nodes.push(fileNode);
                        continue;
                    }
                }

                // Try named link
                const linkNode = this.tryParseNamedLink();
                if (linkNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(linkNode);
                    continue;
                }
            }

            // <emoji:id>
            if (
                char === '<' &&
                this.options.features.includes(ParserFeature.EMOJI) &&
                this.peek('<emoji:')
            ) {
                const emojiNode = this.tryParseEmoji();
                if (emojiNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(emojiNode);
                    continue;
                }
            }

            // - item, * item, + item
            if (
                (char === '-' ||
                    char === '*' ||
                    char === '+' ||
                    char === ' ') &&
                this.options.features.includes(ParserFeature.UNORDERED_LIST)
            ) {
                const listNode = this.tryParseUnorderedList();
                if (listNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(listNode);

                    if (this.peek('\n')) {
                        this.index++;
                    }
                    continue;
                }
            }

            // ***text***, **text**, *text*
            if (
                char === '*' &&
                (this.options.features.includes(ParserFeature.BOLD) ||
                    this.options.features.includes(ParserFeature.ITALIC) ||
                    this.options.features.includes(ParserFeature.BOLD_ITALIC))
            ) {
                const formatNode = this.tryParseFormatting();
                if (formatNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(formatNode);
                    continue;
                }
            }

            // __underline__
            if (
                char === '_' &&
                this.options.features.includes(ParserFeature.UNDERLINE) &&
                this.peek('__')
            ) {
                const underlineNode = this.tryParseUnderline();
                if (underlineNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(underlineNode);
                    continue;
                }
            }

            // ~~strikethrough~~
            if (
                char === '~' &&
                this.options.features.includes(ParserFeature.STRIKETHROUGH) &&
                this.peek('~~')
            ) {
                const strikethroughNode = this.tryParseStrikethrough();
                if (strikethroughNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(strikethroughNode);
                    continue;
                }
            }

            // <userid:'id'>
            if (
                char === '<' &&
                this.options.features.includes(ParserFeature.MENTION) &&
                this.peek("<userid:'")
            ) {
                const mentionNode = this.tryParseMention();
                if (mentionNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(mentionNode);
                    continue;
                }
            }

            // <roleid:'id'>
            if (
                char === '<' &&
                this.options.features.includes(ParserFeature.ROLE_MENTION) &&
                this.peek("<roleid:'")
            ) {
                const roleMentionNode = this.tryParseRoleMention();
                if (roleMentionNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(roleMentionNode);
                    continue;
                }
            }

            // <everyone>
            if (
                char === '<' &&
                this.options.features.includes(
                    ParserFeature.EVERYONE_MENTION,
                ) &&
                this.peek('<everyone>')
            ) {
                const everyoneNode = this.tryParseEveryoneMention();
                if (everyoneNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(everyoneNode);
                    continue;
                }
            }

            // Channel links: http(-s)://localhost:xxxx/chat/@server/{serverId}/channel/{channelId}
            // or http(-s)://(rolling.)catfla.re/chat/@server/{serverId}/channel/{channelId}
            if (
                char === 'h' &&
                this.options.features.includes(ParserFeature.CHANNEL_LINK) &&
                (this.peek('http://') || this.peek('https://'))
            ) {
                const channelLinkNode = this.tryParseChannelLink();
                if (channelLinkNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(channelLinkNode);
                    continue;
                }
            }

            // Invite links: http(-s)://(rolling.)catfla.re/invite/(id)
            if (
                char === 'h' &&
                this.options.features.includes(ParserFeature.INVITE) &&
                (this.peek('http://') || this.peek('https://'))
            ) {
                const inviteNode = this.tryParseInvite();
                if (inviteNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(inviteNode);
                    continue;
                }
            }

            // http:// or https://
            if (
                char === 'h' &&
                this.options.features.includes(ParserFeature.LINK) &&
                (this.peek('http://') || this.peek('https://'))
            ) {
                const linkNode = this.tryParseLink();
                if (linkNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(linkNode);
                    continue;
                }
            }

            // --- (Thematic Break)
            if (
                char === '-' &&
                this.options.features.includes(ParserFeature.THEMATIC_BREAK)
            ) {
                const breakNode = this.tryParseThematicBreak();
                if (breakNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(breakNode);
                    continue;
                }
            }

            // #, ##, ###, -#
            if (
                (char === '#' || (char === '-' && this.peek('-#'))) &&
                (this.options.features.includes(ParserFeature.H1) ||
                    this.options.features.includes(ParserFeature.H2) ||
                    this.options.features.includes(ParserFeature.H3) ||
                    this.options.features.includes(ParserFeature.SUBTEXT))
            ) {
                const headingNode = this.tryParseHeading();
                if (headingNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(headingNode);
                    continue;
                }
            }

            // 1. item
            if (
                ((char >= '0' && char <= '9') || char === ' ') &&
                this.options.features.includes(ParserFeature.ORDERED_LIST)
            ) {
                const listNode = this.tryParseOrderedList();
                if (listNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(listNode);

                    if (this.peek('\n')) {
                        this.index++;
                    }
                    continue;
                }
            }

            // ||text||
            if (
                char === '|' &&
                this.options.features.includes(ParserFeature.TABLE) &&
                (this.index === 0 || this.text[this.index - 1] === '\n')
            ) {
                const tableNode = this.tryParseTable();
                if (tableNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(tableNode);
                    continue;
                }
            }

            // ||text||
            if (
                char === '|' &&
                this.options.features.includes(ParserFeature.SPOILER) &&
                this.peek('||')
            ) {
                const spoilerNode = this.tryParseSpoiler();
                if (spoilerNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(spoilerNode);
                    continue;
                }
            }

            // `code` or ```code```
            if (
                char === '`' &&
                (this.options.features.includes(ParserFeature.INLINE_CODE) ||
                    this.options.features.includes(ParserFeature.CODE_BLOCK) ||
                    this.options.features.includes(ParserFeature.MERMAID))
            ) {
                const codeNode = this.tryParseCode();
                if (codeNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(codeNode);
                    continue;
                }
            }

            // $$text$$ (inline) or $\ntext\n$
            if (
                char === '$' &&
                (this.options.features.includes(ParserFeature.INLINE_LATEX) ||
                    this.options.features.includes(ParserFeature.LATEX))
            ) {
                const latexNode = this.tryParseLatex();
                if (latexNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(latexNode);
                    continue;
                }
            }

            // MyST admonitions: :::type
            if (
                char === ':' &&
                this.options.features.includes(ParserFeature.ADMONITION) &&
                this.peek(':::') &&
                (this.index === 0 || this.text[this.index - 1] === '\n')
            ) {
                const mystNode = this.tryParseMystAdmonition();
                if (mystNode) {
                    if (currentText) {
                        // Trim trailing newline that separates preceding text from the ::: block
                        const trimmed = currentText.endsWith('\n')
                            ? currentText.slice(0, -1)
                            : currentText;
                        nodes.push({ type: 'text', content: trimmed });
                        currentText = '';
                    }
                    nodes.push(mystNode);
                    continue;
                }
            }

            // Blockquotes (and GitHub/Obsidian admonitions)
            if (
                char === '>' &&
                (this.options.features.includes(ParserFeature.BLOCKQUOTE) ||
                    this.options.features.includes(ParserFeature.ADMONITION)) &&
                (this.index === 0 || this.text[this.index - 1] === '\n')
            ) {
                const blockquoteNode = this.tryParseBlockquote();
                if (blockquoteNode) {
                    if (currentText) {
                        nodes.push({ type: 'text', content: currentText });
                        currentText = '';
                    }
                    nodes.push(blockquoteNode);
                    continue;
                }
            }

            currentText += char;
            this.index++;
        }

        if (currentText) {
            nodes.push({ type: 'text', content: currentText });
        }

        return nodes;
    }

    private peek(str: string): boolean {
        return this.text.startsWith(str, this.index);
    }

    private tryParseUnicodeEmoji(): ASTNode | null {
        // Optimization: use slice to create a substring for matching
        const remaining = this.text.slice(this.index);
        const match = remaining.match(this.startsWithEmojiRegex);

        if (match) {
            const content = match[0];
            this.index += content.length;
            return { type: 'unicode_emoji', content };
        }

        return null;
    }

    private tryParseEmoji(): ASTNode | null {
        const start = this.index;
        this.index += 7; // skip '<emoji:'
        let emojiId = '';

        while (this.index < this.text.length && this.text[this.index] !== '>') {
            const c = this.text[this.index];
            // Valid emoji characters: a-z, A-Z, 0-9, _, -
            if (
                (c >= 'a' && c <= 'z') ||
                (c >= 'A' && c <= 'Z') ||
                (c >= '0' && c <= '9') ||
                c === '_' ||
                c === '-'
            ) {
                emojiId += c;
                this.index++;
            } else {
                this.index = start;
                return null;
            }
        }

        if (
            this.index < this.text.length &&
            this.text[this.index] === '>' &&
            emojiId
        ) {
            this.index++; // skip '>'
            return { type: 'emoji', emojiId };
        }

        this.index = start;
        return null;
    }

    private tryParseFormatting(): ASTNode | null {
        const start = this.index;
        let starCount = 0;

        // Count leading stars up to 3
        while (
            this.index < this.text.length &&
            this.text[this.index] === '*' &&
            starCount < 3
        ) {
            starCount++;
            this.index++;
        }

        if (starCount === 0) return null;

        // Features check
        if (
            starCount === 3 &&
            !this.options.features.includes(ParserFeature.BOLD_ITALIC)
        ) {
            this.index = start;
            return null;
        }
        if (
            starCount === 2 &&
            !this.options.features.includes(ParserFeature.BOLD)
        ) {
            this.index = start;
            return null;
        }
        if (
            starCount === 1 &&
            !this.options.features.includes(ParserFeature.ITALIC)
        ) {
            this.index = start;
            return null;
        }

        const closingSequence = '*'.repeat(starCount);
        let content = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            if (this.peek(closingSequence)) {
                if (
                    starCount < 3 &&
                    this.text[this.index + starCount] === '*'
                ) {
                    while (
                        this.index < this.text.length &&
                        this.text[this.index] === '*'
                    ) {
                        content += this.text[this.index];
                        this.index++;
                    }
                    continue;
                }
                foundClosing = true;
                break;
            }
            content += this.text[this.index];
            this.index++;
        }

        if (foundClosing && content) {
            this.index += starCount;
            const type =
                starCount === 3
                    ? 'bold_italic'
                    : starCount === 2
                      ? 'bold'
                      : 'italic';
            return { type, content: this.parseContent(content) } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseHeading(): ASTNode | null {
        const start = this.index;

        if (this.peek('### ')) {
            this.index += 4;
            let content = '';
            while (
                this.index < this.text.length &&
                this.text[this.index] !== '\n'
            ) {
                content += this.text[this.index];
                this.index++;
            }
            if (content.trim()) {
                if (
                    this.index < this.text.length &&
                    this.text[this.index] === '\n'
                ) {
                    this.index++;
                }
                return {
                    type: 'h3',
                    content: this.parseContent(content.trim()),
                } as ASTNode;
            }
        } else if (this.peek('## ')) {
            this.index += 3;
            let content = '';
            while (
                this.index < this.text.length &&
                this.text[this.index] !== '\n'
            ) {
                content += this.text[this.index];
                this.index++;
            }
            if (content.trim()) {
                if (
                    this.index < this.text.length &&
                    this.text[this.index] === '\n'
                ) {
                    this.index++;
                }
                return {
                    type: 'h2',
                    content: this.parseContent(content.trim()),
                } as ASTNode;
            }
        } else if (this.peek('# ')) {
            this.index += 2;
            let content = '';
            while (
                this.index < this.text.length &&
                this.text[this.index] !== '\n'
            ) {
                content += this.text[this.index];
                this.index++;
            }
            if (content.trim()) {
                if (
                    this.index < this.text.length &&
                    this.text[this.index] === '\n'
                ) {
                    this.index++;
                }
                return {
                    type: 'h1',
                    content: this.parseContent(content.trim()),
                } as ASTNode;
            }
        } else if (this.peek('-# ')) {
            this.index += 3;
            let content = '';
            while (
                this.index < this.text.length &&
                this.text[this.index] !== '\n'
            ) {
                content += this.text[this.index];
                this.index++;
            }
            if (content.trim()) {
                if (
                    this.index < this.text.length &&
                    this.text[this.index] === '\n'
                ) {
                    this.index++;
                }
                return {
                    type: 'subtext',
                    content: this.parseContent(content.trim()),
                } as ASTNode;
            }
        }

        this.index = start;
        return null;
    }

    private tryParseSpoiler(): ASTNode | null {
        const start = this.index;
        this.index += 2; // skip '||'

        let content = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            if (this.peek('||')) {
                foundClosing = true;
                break;
            }
            content += this.text[this.index];
            this.index++;
        }

        if (foundClosing && content) {
            this.index += 2; // skip '||'
            return {
                type: 'spoiler',
                content: this.parseContent(content),
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseCode(): ASTNode | null {
        const start = this.index;

        // Try parse multiline code block first
        if (this.peek('```')) {
            this.index += 3;
            let language = '';

            // Optional language
            while (
                this.index < this.text.length &&
                this.text[this.index] !== '\n' &&
                this.text[this.index] !== ' '
            ) {
                language += this.text[this.index];
                this.index++;
            }

            // Skip space/newline after language
            if (
                this.index < this.text.length &&
                (this.text[this.index] === '\n' ||
                    this.text[this.index] === ' ')
            ) {
                this.index++;
            }

            let content = '';
            let foundClosing = false;

            while (this.index < this.text.length) {
                if (this.peek('```')) {
                    foundClosing = true;
                    break;
                }
                content += this.text[this.index];
                this.index++;
            }

            if (foundClosing) {
                this.index += 3;
                const lang = language.trim();

                if (
                    lang === 'mermaid' &&
                    this.options.features.includes(ParserFeature.MERMAID)
                ) {
                    return {
                        type: 'mermaid',
                        content: content.trim(),
                    } as ASTNode;
                }

                return {
                    type: 'code_block',
                    content: content.trim(),
                    language: lang || undefined,
                } as ASTNode;
            }

            this.index = start;
            return null;
        }

        // Try parse inline code
        if (this.peek('`')) {
            this.index += 1;
            let content = '';
            let foundClosing = false;

            while (this.index < this.text.length) {
                if (this.text[this.index] === '`') {
                    foundClosing = true;
                    break;
                }
                content += this.text[this.index];
                this.index++;
            }

            if (foundClosing && content) {
                this.index += 1;
                return { type: 'inline_code', content } as ASTNode;
            }
        }

        this.index = start;
        return null;
    }

    private tryParseFile(): ASTNode | null {
        const start = this.index;
        // Syntax: [%file%](url)
        if (this.peek('[%file%](')) {
            this.index += 9; // Skip [%file%](
            let url = '';
            let depth = 1;

            while (this.index < this.text.length) {
                const c = this.text[this.index];
                if (c === '(') depth++;
                if (c === ')') depth--;

                if (depth === 0) {
                    break;
                }
                url += c;
                this.index++;
            }

            if (depth === 0 && url) {
                this.index++; // Skip )
                return { type: 'file', url } as ASTNode;
            }
        }

        this.index = start;
        return null;
    }

    private tryParseMention(): ASTNode | null {
        const start = this.index;
        // Syntax: <userid:'ID'>
        if (this.peek("<userid:'")) {
            this.index += 9; // Skip <userid:'
            let userId = '';

            while (
                this.index < this.text.length &&
                this.text[this.index] !== "'"
            ) {
                userId += this.text[this.index];
                this.index++;
            }

            if (
                this.index + 2 <= this.text.length &&
                this.text[this.index] === "'" &&
                this.text[this.index + 1] === '>' &&
                userId
            ) {
                this.index += 2; // Skip '>
                return { type: 'mention', userId } as ASTNode;
            }
        }

        this.index = start;
        return null;
    }

    private tryParseRoleMention(): ASTNode | null {
        const start = this.index;
        // Syntax: <roleid:'ID'>
        if (this.peek("<roleid:'")) {
            this.index += 9; // Skip <roleid:'
            let roleId = '';

            while (
                this.index < this.text.length &&
                this.text[this.index] !== "'"
            ) {
                roleId += this.text[this.index];
                this.index++;
            }

            if (
                this.index + 2 <= this.text.length &&
                this.text[this.index] === "'" &&
                this.text[this.index + 1] === '>' &&
                roleId
            ) {
                this.index += 2; // Skip '>
                return { type: 'role_mention', roleId } as ASTNode;
            }
        }

        this.index = start;
        return null;
    }

    private tryParseInvite(): ASTNode | null {
        const start = this.index;
        const inviteRegex =
            /^https?:\/\/(?:rolling\.)?catfla\.re\/invite\/([a-zA-Z0-9_-]+)/;
        const remainingText = this.text.slice(this.index);
        const match = remainingText.match(inviteRegex);

        if (match) {
            const url = match[0];
            const code = match[1];
            this.index += url.length;
            return { type: 'invite', code, url };
        }

        this.index = start;
        return null;
    }

    private tryParseLink(): ASTNode | null {
        const start = this.index;
        let url = '';

        // Continue until whitespace or end of string
        while (this.index < this.text.length) {
            const c = this.text[this.index];
            if (c === ' ' || c === '\n' || c === '\t' || c === '\r') {
                break;
            }
            url += c;
            this.index++;
        }

        if (url) {
            return { type: 'link', url, text: url };
        }

        this.index = start;
        return null;
    }

    private tryParseOrderedList(): ASTNode | null {
        const start = this.index;

        // Must be at start of line
        if (this.index > 0 && this.text[this.index - 1] !== '\n') {
            return null;
        }

        const remaining = this.text.slice(this.index);
        const match = remaining.match(/^( *)(-?\d+)\. /);
        if (!match) return null;

        const indentation = match[1].length;
        const number = match[2];
        this.index += match[0].length;

        let content = '';
        while (
            this.index < this.text.length &&
            this.text[this.index] !== '\n'
        ) {
            content += this.text[this.index];
            this.index++;
        }

        if (content.trim()) {
            return {
                type: 'ordered_list',
                number,
                content: this.parseContent(content.trim()),
                depth: Math.floor(indentation / 2),
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseUnorderedList(): ASTNode | null {
        const start = this.index;

        if (this.index > 0 && this.text[this.index - 1] !== '\n') {
            return null;
        }

        const remaining = this.text.slice(this.index);
        const match = remaining.match(/^( *)([*\-+]) /);
        if (!match) return null;

        const indentation = match[1].length;
        this.index += match[0].length;

        let content = '';
        while (
            this.index < this.text.length &&
            this.text[this.index] !== '\n'
        ) {
            content += this.text[this.index];
            this.index++;
        }

        if (content.trim()) {
            return {
                type: 'unordered_list',
                content: this.parseContent(content.trim()),
                depth: Math.floor(indentation / 2),
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseTable(): ASTNode | null {
        const start = this.index;

        // Must be at start of line
        if (this.index > 0 && this.text[this.index - 1] !== '\n') {
            return null;
        }

        // Try to parse the header row
        if (this.text[this.index] !== '|') {
            return null;
        }

        // Parse header row
        let headerLine = '';
        let tempIndex = this.index;
        while (tempIndex < this.text.length && this.text[tempIndex] !== '\n') {
            headerLine += this.text[tempIndex];
            tempIndex++;
        }

        if (!headerLine.startsWith('|') || !headerLine.endsWith('|')) {
            this.index = start;
            return null;
        }

        // Parse separator row
        if (tempIndex >= this.text.length) {
            this.index = start;
            return null;
        }

        tempIndex++; // Skip newline
        let separatorLine = '';
        const separatorStart = tempIndex;
        while (tempIndex < this.text.length && this.text[tempIndex] !== '\n') {
            separatorLine += this.text[tempIndex];
            tempIndex++;
        }

        // Check if separator line is valid
        if (!separatorLine.startsWith('|') || !separatorLine.endsWith('|')) {
            this.index = start;
            return null;
        }

        const separatorCells = separatorLine
            .split('|')
            .slice(1, -1) // Remove empty first and last elements
            .map((cell) => cell.trim());

        // Check if all separator cells are dashes (with optional colons for alignment)
        const isValidSeparator = separatorCells.every((cell) =>
            /^:?-+:?$/.test(cell),
        );

        if (!isValidSeparator) {
            this.index = start;
            return null;
        }

        // Parse headers
        const headers = headerLine
            .split('|')
            .slice(1, -1) // Remove empty first and last elements
            .map((header) => this.parseContent(header.trim()));

        // If header count doesn't match separator count, it's not a valid table
        if (headers.length !== separatorCells.length) {
            this.index = start;
            return null;
        }

        // Now we know it's a valid table, move past header and separator
        this.index = separatorStart + separatorLine.length;
        if (this.index < this.text.length && this.text[this.index] === '\n') {
            this.index++;
        }

        // Parse body rows
        const rows: (string | ASTNode[])[][] = [];
        while (this.index < this.text.length) {
            const lineStart = this.index;
            if (this.text[this.index] !== '|') {
                break;
            }

            let rowLine = '';
            while (
                this.index < this.text.length &&
                this.text[this.index] !== '\n'
            ) {
                rowLine += this.text[this.index];
                this.index++;
            }

            if (!rowLine.startsWith('|') || !rowLine.endsWith('|')) {
                this.index = lineStart;
                break;
            }

            // Split by pipe but respect spoilers
            const cells: string[] = [];
            let currentCell = '';
            let inSpoiler = false;

            // Skip first and last pipe as checked above
            for (let i = 1; i < rowLine.length - 1; i++) {
                const char = rowLine[i];

                if (char === '|') {
                    if (inSpoiler) {
                        // Check if this closes the spoiler
                        if (rowLine[i + 1] === '|') {
                            currentCell += '||';
                            inSpoiler = false;
                            i++; // Skip next char
                        } else {
                            currentCell += char;
                        }
                    } else {
                        // If we are at the start of a cell (empty content), check for spoiler start
                        if (
                            currentCell.length === 0 &&
                            rowLine[i + 1] === '|'
                        ) {
                            // Check if there is a closing || later
                            const remaining = rowLine.slice(i + 2);
                            if (remaining.includes('||')) {
                                currentCell += '||';
                                inSpoiler = true;
                                i++; // Skip next char
                                continue;
                            }
                        }

                        // Otherwise it is a separator
                        cells.push(currentCell.trim());
                        currentCell = '';
                    }
                } else {
                    currentCell += char;
                }
            }
            // Add the last cell
            cells.push(currentCell.trim());

            const parsedCells = cells.map((cell) => this.parseContent(cell));

            if (parsedCells.length > headers.length) {
                rows.push(parsedCells.slice(0, headers.length));
            } else {
                while (parsedCells.length < headers.length) {
                    parsedCells.push([]);
                }
                rows.push(parsedCells);
            }

            if (
                this.index < this.text.length &&
                this.text[this.index] === '\n'
            ) {
                this.index++;
            } else {
                break;
            }
        }

        // Return table if we have at least the headers
        if (headers.length > 0) {
            return {
                type: 'table',
                headers,
                rows,
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseNamedLink(): ASTNode | null {
        const start = this.index;
        if (this.text[this.index] === '[') {
            this.index++;
            let label = '';
            let depth = 1;
            while (this.index < this.text.length) {
                const c = this.text[this.index];
                if (c === '[') depth++;
                if (c === ']') depth--;
                if (depth === 0) break;
                label += c;
                this.index++;
            }

            if (depth === 0 && label && this.peek('](')) {
                this.index += 2; // Skip ](
                let url = '';
                let urlDepth = 1;
                while (this.index < this.text.length) {
                    const c = this.text[this.index];
                    if (c === '(') urlDepth++;
                    if (c === ')') urlDepth--;
                    if (urlDepth === 0) break;
                    url += c;
                    this.index++;
                }

                if (urlDepth === 0 && url) {
                    this.index++; // Skip )
                    return {
                        type: 'link',
                        url,
                        text: this.parseContent(label),
                    } as ASTNode;
                }
            }
        }
        this.index = start;
        return null;
    }

    private parseContent(content: string): string | ASTNode[] {
        const nodes = parseText(content, this.options);
        if (nodes.length === 1 && nodes[0].type === 'text') {
            return nodes[0].content;
        }
        return nodes;
    }

    private tryParseEveryoneMention(): ASTNode | null {
        if (this.peek('<everyone>')) {
            this.index += 10;
            return { type: 'everyone' };
        }
        return null;
    }

    private tryParseChannelLink(): ASTNode | null {
        const start = this.index;
        // Pattern: http(s)://localhost:5173/chat/@server/{serverId}/channel/{channelId}(/message/{messageId})?
        // or http(s)://localhost:8001/chat/@server/{serverId}/channel/{channelId}(/message/{messageId})?
        // or http(s)://(rolling.)catfla.re/chat/@server/{serverId}/channel/{channelId}(/message/{messageId})?
        const channelLinkRegex =
            /^https?:\/\/(?:localhost:(?:5173|8001)|(?:rolling\.)?catfla\.re)\/chat\/@server\/([a-zA-Z0-9]+)\/channel\/([a-zA-Z0-9]+)(?:\/message\/([a-zA-Z0-9]+))?/;
        const remainingText = this.text.slice(this.index);
        const match = remainingText.match(channelLinkRegex);

        if (match) {
            const url = match[0];
            const serverId = match[1];
            const channelId = match[2];
            const messageId = match[3];
            this.index += url.length;
            return {
                type: 'channel_link',
                serverId,
                channelId,
                url,
                messageId,
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseLatex(): ASTNode | null {
        const start = this.index;

        // Display LaTeX: $ at end of line or start, content on separate lines, closing $ on its own line
        // Syntax: $\ncontent\n$
        if (
            this.options.features.includes(ParserFeature.LATEX) &&
            this.peek('$\n')
        ) {
            this.index += 2; // skip '$\n'
            let content = '';
            let foundClosing = false;

            while (this.index < this.text.length) {
                if (this.peek('\n$')) {
                    const afterClose = this.index + 2;
                    if (
                        afterClose >= this.text.length ||
                        this.text[afterClose] === '\n'
                    ) {
                        foundClosing = true;
                        break;
                    }
                }
                content += this.text[this.index];
                this.index++;
            }

            if (foundClosing && content.trim()) {
                this.index += 2; // skip '\n$'
                return { type: 'latex', content: content.trim() };
            }

            this.index = start;
        }

        // Inline LaTeX: $$content$$
        if (
            this.options.features.includes(ParserFeature.INLINE_LATEX) &&
            this.peek('$$')
        ) {
            this.index += 2; // skip '$$'
            let content = '';
            let foundClosing = false;

            while (this.index < this.text.length) {
                if (this.peek('$$')) {
                    foundClosing = true;
                    break;
                }
                content += this.text[this.index];
                this.index++;
            }

            if (foundClosing && content) {
                this.index += 2; // skip '$$'
                return { type: 'inline_latex', content };
            }

            this.index = start;
        }

        return null;
    }

    private tryParseThematicBreak(): ASTNode | null {
        const start = this.index;

        // Must be at start of line
        if (this.index > 0 && this.text[this.index - 1] !== '\n') {
            return null;
        }

        let dashCount = 0;
        let tempIndex = this.index;

        // Count dashes and trailing spaces
        while (tempIndex < this.text.length) {
            const c = this.text[tempIndex];
            if (c === '-') {
                dashCount++;
            } else if (c !== ' ' && c !== '\t' && c !== '\r') {
                break;
            }
            tempIndex++;
        }

        // Must be 3 dashes, and the line must ends after
        if (
            dashCount === 3 &&
            (tempIndex >= this.text.length || this.text[tempIndex] === '\n')
        ) {
            this.index = tempIndex;
            if (
                this.index < this.text.length &&
                this.text[this.index] === '\n'
            ) {
                this.index++;
            }
            return { type: 'thematic_break' };
        }

        this.index = start;
        return null;
    }

    private tryParseUnderline(): ASTNode | null {
        const start = this.index;
        this.index += 2; // skip '__'

        let content = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            if (this.peek('__')) {
                foundClosing = true;
                break;
            }
            content += this.text[this.index];
            this.index++;
        }

        if (foundClosing && content) {
            this.index += 2; // skip '__'
            return {
                type: 'underline',
                content: this.parseContent(content),
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseStrikethrough(): ASTNode | null {
        const start = this.index;
        this.index += 2; // skip '~~'

        let content = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            if (this.peek('~~')) {
                foundClosing = true;
                break;
            }
            content += this.text[this.index];
            this.index++;
        }

        if (foundClosing && content) {
            this.index += 2; // skip '~~'
            return {
                type: 'strikethrough',
                content: this.parseContent(content),
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseBlockquote(): ASTNode | null {
        const start = this.index;

        if (this.peek('>>> ')) {
            this.index += 4;
            const content = this.text.slice(this.index);
            this.index = this.text.length;
            return {
                type: 'blockquote',
                content: this.parseContent(content),
                multiline: true,
            } as ASTNode;
        }

        if (this.peek('>')) {
            const lines: string[] = [];
            let tempIndex = this.index;

            while (tempIndex < this.text.length) {
                if (
                    tempIndex > this.index &&
                    this.text[tempIndex - 1] !== '\n'
                ) {
                    break;
                }

                if (this.text.startsWith('>', tempIndex)) {
                    tempIndex++; // Skip >
                    // Optional space
                    if (this.text[tempIndex] === ' ') {
                        tempIndex++;
                    }

                    let lineContent = '';
                    while (
                        tempIndex < this.text.length &&
                        this.text[tempIndex] !== '\n'
                    ) {
                        lineContent += this.text[tempIndex];
                        tempIndex++;
                    }
                    lines.push(lineContent);

                    if (this.text[tempIndex] === '\n') {
                        tempIndex++;
                    }
                } else {
                    break;
                }
            }

            if (lines.length > 0) {
                // Check for GitHub/Obsidian admonition
                if (this.options.features.includes(ParserFeature.ADMONITION)) {
                    const firstLine = lines[0];
                    let parsedType = '';
                    let parsedFoldModifier = '';
                    let parsedTitle = '';
                    let isValidAdmonition = false;

                    if (firstLine.startsWith('[!')) {
                        let i = 2; // skip '[!'

                        // Parse characters for type [a-zA-Z]
                        while (i < firstLine.length) {
                            const c = firstLine[i];
                            if (
                                (c >= 'a' && c <= 'z') ||
                                (c >= 'A' && c <= 'Z')
                            ) {
                                parsedType += c;
                                i++;
                            } else {
                                break;
                            }
                        }

                        // Expect closing bracket ']'
                        if (
                            parsedType.length > 0 &&
                            i < firstLine.length &&
                            firstLine[i] === ']'
                        ) {
                            i++; // skip ']'
                            isValidAdmonition = true;

                            // Parse optional fold modifier '+' or '-'
                            if (
                                i < firstLine.length &&
                                (firstLine[i] === '+' || firstLine[i] === '-')
                            ) {
                                parsedFoldModifier = firstLine[i];
                                i++;
                            }

                            // Parse optional title
                            if (i < firstLine.length) {
                                parsedTitle = firstLine.substring(i).trim();
                            }
                        }
                    }

                    if (isValidAdmonition) {
                        const rawType = parsedType.toLowerCase();
                        const foldModifier = parsedFoldModifier;
                        const titleRemainder = parsedTitle;

                        const hasObsidianFeatures =
                            foldModifier !== '' || titleRemainder !== '';

                        // Define supported types
                        const githubTypes = new Set([
                            'note',
                            'tip',
                            'important',
                            'warning',
                            'caution',
                        ]);
                        const obsidianTypes = new Set([
                            'note',
                            'abstract',
                            'summary',
                            'tldr',
                            'info',
                            'todo',
                            'tip',
                            'hint',
                            'important',
                            'success',
                            'check',
                            'done',
                            'question',
                            'help',
                            'faq',
                            'warning',
                            'caution',
                            'attention',
                            'failure',
                            'fail',
                            'missing',
                            'danger',
                            'error',
                            'bug',
                            'example',
                            'quote',
                            'cite',
                            'seealso',
                        ]);

                        let style: 'github' | 'obsidian' | null = null;

                        if (hasObsidianFeatures) {
                            style = 'obsidian';
                        } else if (githubTypes.has(rawType)) {
                            style = 'github';
                        } else if (obsidianTypes.has(rawType)) {
                            style = 'obsidian';
                        } else {
                            style = null;
                        }

                        let fallbackToBlockquote = false;
                        if (!style) {
                            fallbackToBlockquote = true;
                        } else if (style === 'github' && lines.length < 2) {
                            fallbackToBlockquote = true;
                        }

                        if (!fallbackToBlockquote) {
                            this.index = tempIndex;
                            const bodyLines = lines.slice(1);
                            const bodyText = bodyLines.join('\n');

                            const node: ASTNode = {
                                type: 'admonition',
                                style: style as 'github' | 'obsidian',
                                admonitionType: rawType,
                                title:
                                    titleRemainder !== ''
                                        ? titleRemainder
                                        : undefined,
                                collapsible:
                                    style === 'obsidian' && foldModifier !== ''
                                        ? true
                                        : undefined,
                                defaultOpen:
                                    style === 'obsidian' && foldModifier !== ''
                                        ? foldModifier === '+'
                                        : undefined,
                                content:
                                    bodyText === ''
                                        ? ''
                                        : this.parseContent(bodyText),
                            };
                            return node;
                        }
                    }
                }

                if (this.options.features.includes(ParserFeature.BLOCKQUOTE)) {
                    this.index = tempIndex;
                    return {
                        type: 'blockquote',
                        content: this.parseContent(lines.join('\n')),
                        multiline: false,
                    } as ASTNode;
                }
            }
        }

        this.index = start;
        return null;
    }

    private tryParseMystAdmonition(): ASTNode | null {
        const start = this.index;

        if (!this.peek(':::')) {
            return null;
        }

        this.index += 3; // skip ':::'

        let rawType = '';
        while (
            this.index < this.text.length &&
            this.text[this.index] !== ' ' &&
            this.text[this.index] !== '\n'
        ) {
            rawType += this.text[this.index];
            this.index++;
        }

        if (rawType.startsWith('{') && rawType.endsWith('}')) {
            rawType = rawType.slice(1, -1);
        }

        if (!rawType) {
            this.index = start;
            return null;
        }

        let title: string | undefined;
        if (this.index < this.text.length && this.text[this.index] === ' ') {
            this.index++; // skip space
            let titleText = '';
            while (
                this.index < this.text.length &&
                this.text[this.index] !== '\n'
            ) {
                titleText += this.text[this.index];
                this.index++;
            }
            title = titleText.trim() || undefined;
        }

        if (this.index < this.text.length && this.text[this.index] === '\n') {
            this.index++;
        }

        let bodyText = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            // Check for closing ::: on its own line
            if (
                this.peek(':::') &&
                (this.index === 0 || this.text[this.index - 1] === '\n')
            ) {
                const afterClose = this.index + 3;
                if (
                    afterClose >= this.text.length ||
                    this.text[afterClose] === '\n'
                ) {
                    foundClosing = true;
                    break;
                }
            }
            bodyText += this.text[this.index];
            this.index++;
        }

        if (!foundClosing) {
            this.index = start;
            return null;
        }

        this.index += 3; // skip closing ':::'
        if (this.index < this.text.length && this.text[this.index] === '\n') {
            this.index++;
        }

        const trimmedBody = bodyText.trim();
        const node: ASTNode = {
            type: 'admonition',
            style: 'myst',
            admonitionType: rawType.toLowerCase(),
            title,
            content: trimmedBody === '' ? '' : this.parseContent(trimmedBody),
        };
        return node;
    }
}

export function parseText(text: string, options: ParserOptions): ASTNode[] {
    const parser = new TextParser(text, options);
    return parser.parse();
}
