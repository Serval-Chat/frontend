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

            // Unicode Emoji
            // Optimization: All emojis have char codes > 127
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

            // [%file%](url)
            if (
                char === '[' &&
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
                    this.options.features.includes(ParserFeature.CODE_BLOCK))
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

        const closingStars = '*'.repeat(starCount);
        let content = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            if (this.peek(closingStars)) {
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
            return { type, content } as ASTNode;
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
            if (content.trim())
                return { type: 'h3', content: content.trim() } as ASTNode;
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
            if (content.trim())
                return { type: 'h2', content: content.trim() } as ASTNode;
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
            if (content.trim())
                return { type: 'h1', content: content.trim() } as ASTNode;
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
            if (content.trim())
                return { type: 'subtext', content: content.trim() } as ASTNode;
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
            return { type: 'spoiler', content } as ASTNode;
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
                return {
                    type: 'code_block',
                    content: content.trim(),
                    language: language.trim() || undefined,
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
}

export function parseText(text: string, options: ParserOptions): ASTNode[] {
    const parser = new TextParser(text, options);
    return parser.parse();
}
