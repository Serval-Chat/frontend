import { FLAGS } from '@/flags';
import { censorText } from '@/utils/censorship';
import { emojiRegex } from '@/utils/emoji';

import {
    type ASTNode,
    ParserFeature,
    type ParserFeature as ParserFeatureType,
} from './types';

const STARTS_WITH_EMOJI_REGEX = new RegExp('^' + emojiRegex.source);
const featureSetCache = new WeakMap<
    readonly ParserFeatureType[],
    ReadonlySet<ParserFeatureType>
>();
let cachedBaseUrlPattern: string | null = null;

const getFeatureSet = (
    features: readonly ParserFeatureType[],
): ReadonlySet<ParserFeatureType> => {
    const cached = featureSetCache.get(features);
    if (cached) return cached;

    const set = new Set(features);
    featureSetCache.set(features, set);
    return set;
};

const getBaseUrlPattern = (): string => {
    if (cachedBaseUrlPattern && import.meta.env.NODE_ENV !== 'test')
        return cachedBaseUrlPattern;

    const alternativeUrlsStr = import.meta.env.VITE_ALTERNATIVE_URLS || '[]';
    let alternativeUrls: string[] = [];
    try {
        alternativeUrls = JSON.parse(alternativeUrlsStr);
    } catch (e) {
        console.warn('Failed to parse VITE_ALTERNATIVE_URLS:', e);
    }

    const defaultDomains = [
        'https?://(?:rolling\\.)?catfla\\.re',
        'https?://localhost:(?:5173|8001)',
    ];

    if (typeof window !== 'undefined' && window.location.hostname) {
        const escapedHostname = window.location.hostname.replace(
            /[.*+?^${}()|[\]\\]/g,
            '\\$&',
        );
        const pattern = `https?://${escapedHostname}(?::\\d+)?`;
        if (!defaultDomains.includes(pattern)) {
            defaultDomains.push(pattern);
        }
    }

    const escapedAlts = alternativeUrls.map((url): string =>
        url.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\/$/, ''),
    );

    cachedBaseUrlPattern = `(?:${[...defaultDomains, ...escapedAlts].join('|')})`;
    return cachedBaseUrlPattern;
};

export interface ParserOptions {
    readonly features: readonly ParserFeatureType[];
    readonly enableCensorship?: boolean;
}

export const ParserPresets = {
    MESSAGE: {
        enableCensorship: FLAGS.ENABLE_CENSORSHIP,
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
            ParserFeature.KLIPY,
            ParserFeature.CHECKLIST,
            ParserFeature.CURLY_UNDERLINE,
            ParserFeature.JAGGED_UNDERLINE,
            ParserFeature.DOUBLE_UNDERLINE,
            ParserFeature.DOUBLE_CURLY_UNDERLINE,
            ParserFeature.DASHED_UNDERLINE,
            ParserFeature.DOTTED_UNDERLINE,
            ParserFeature.RHYTHM_UNDERLINE,
            ParserFeature.SUPERSCRIPT,
            ParserFeature.SUBSCRIPT,
            ParserFeature.STACKED_SCRIPT,
            ParserFeature.TIMESTAMP,
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
            ParserFeature.MENTION,
            ParserFeature.ORDERED_LIST,
            ParserFeature.UNORDERED_LIST,
            ParserFeature.INLINE_LATEX,
            ParserFeature.UNDERLINE,
            ParserFeature.STRIKETHROUGH,
            ParserFeature.BLOCKQUOTE,
            ParserFeature.CURLY_UNDERLINE,
            ParserFeature.JAGGED_UNDERLINE,
            ParserFeature.DOUBLE_UNDERLINE,
            ParserFeature.DOUBLE_CURLY_UNDERLINE,
            ParserFeature.DASHED_UNDERLINE,
            ParserFeature.DOTTED_UNDERLINE,
            ParserFeature.RHYTHM_UNDERLINE,
            ParserFeature.SUPERSCRIPT,
            ParserFeature.SUBSCRIPT,
            ParserFeature.STACKED_SCRIPT,
            ParserFeature.TIMESTAMP,
        ],
    },
    EMBED: {
        features: [
            ParserFeature.BOLD,
            ParserFeature.ITALIC,
            ParserFeature.BOLD_ITALIC,
            ParserFeature.UNDERLINE,
            ParserFeature.STRIKETHROUGH,
            ParserFeature.INLINE_CODE,
            ParserFeature.SPOILER,
            ParserFeature.EMOJI,
            ParserFeature.UNICODE_EMOJI,
            ParserFeature.LINK,
            ParserFeature.MENTION,
            ParserFeature.ROLE_MENTION,
            ParserFeature.EVERYONE_MENTION,
            ParserFeature.CHANNEL_LINK,
            ParserFeature.INLINE_LATEX,
            ParserFeature.CURLY_UNDERLINE,
            ParserFeature.JAGGED_UNDERLINE,
            ParserFeature.DOUBLE_UNDERLINE,
            ParserFeature.DOUBLE_CURLY_UNDERLINE,
            ParserFeature.DASHED_UNDERLINE,
            ParserFeature.DOTTED_UNDERLINE,
            ParserFeature.RHYTHM_UNDERLINE,
            ParserFeature.SUPERSCRIPT,
            ParserFeature.SUBSCRIPT,
            ParserFeature.STACKED_SCRIPT,
            ParserFeature.TIMESTAMP,
        ],
    },
    EMBED_INLINE: {
        features: [
            ParserFeature.BOLD,
            ParserFeature.ITALIC,
            ParserFeature.BOLD_ITALIC,
            ParserFeature.UNDERLINE,
            ParserFeature.STRIKETHROUGH,
            ParserFeature.INLINE_CODE,
            ParserFeature.LINK,
            ParserFeature.SPOILER,
            ParserFeature.EMOJI,
            ParserFeature.UNICODE_EMOJI,
            ParserFeature.MENTION,
            ParserFeature.ROLE_MENTION,
            ParserFeature.EVERYONE_MENTION,
            ParserFeature.CHANNEL_LINK,
            ParserFeature.INLINE_LATEX,
            ParserFeature.CURLY_UNDERLINE,
            ParserFeature.JAGGED_UNDERLINE,
            ParserFeature.DOUBLE_UNDERLINE,
            ParserFeature.DOUBLE_CURLY_UNDERLINE,
            ParserFeature.DASHED_UNDERLINE,
            ParserFeature.DOTTED_UNDERLINE,
            ParserFeature.RHYTHM_UNDERLINE,
            ParserFeature.SUPERSCRIPT,
            ParserFeature.SUBSCRIPT,
            ParserFeature.STACKED_SCRIPT,
            ParserFeature.TIMESTAMP,
        ],
    },
} as const;

export class TextParser {
    private text: string;
    private index: number = 0;
    private options: ParserOptions;
    private featureSet: ReadonlySet<ParserFeatureType>;

    constructor(text: string, options: ParserOptions) {
        this.text = text;
        this.options = options;
        this.featureSet = getFeatureSet(options.features);
    }

    private has(feature: ParserFeatureType): boolean {
        return this.featureSet.has(feature);
    }

    public parse(): ASTNode[] {
        const nodes: ASTNode[] = [];
        let currentText = '';

        while (this.index < this.text.length) {
            const char = this.text[this.index];
            const charCode = char.charCodeAt(0);

            if (char === '\\' && this.index + 1 < this.text.length) {
                currentText = this.flushText(nodes, currentText);

                const escapedChar = this.text[this.index + 1];

                nodes.push({ type: 'text', content: escapedChar });

                this.index += 2;
                continue;
            }

            if (charCode > 127 && this.has(ParserFeature.UNICODE_EMOJI)) {
                const emojiNode = this.tryParseUnicodeEmoji();
                if (emojiNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(emojiNode);
                    continue;
                }
            }

            if (char === '[' && this.has(ParserFeature.LINK)) {
                if (this.has(ParserFeature.FILE) && this.peek('[%file%]')) {
                    const fileNode = this.tryParseFile();
                    if (fileNode) {
                        currentText = this.flushText(nodes, currentText);
                        nodes.push(fileNode);
                        continue;
                    }
                }

                const linkNode = this.tryParseNamedLink();
                if (linkNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(linkNode);
                    continue;
                }
            }

            if (
                char === '<' &&
                this.has(ParserFeature.EMOJI) &&
                this.peek('<emoji:')
            ) {
                const emojiNode = this.tryParseEmoji();
                if (emojiNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(emojiNode);
                    continue;
                }
            }

            if (
                char === '<' &&
                this.has(ParserFeature.TIMESTAMP) &&
                this.peek('<t:')
            ) {
                const timestampNode = this.tryParseTimestamp();
                if (timestampNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(timestampNode);
                    continue;
                }
            }

            if (
                (char === '-' ||
                    char === '*' ||
                    char === '+' ||
                    char === ' ') &&
                this.has(ParserFeature.CHECKLIST)
            ) {
                const checklistNode = this.tryParseChecklist();
                if (checklistNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(checklistNode);

                    if (this.peek('\n')) {
                        this.index++;
                    }
                    continue;
                }
            }

            if (
                (char === '-' ||
                    char === '*' ||
                    char === '+' ||
                    char === ' ') &&
                this.has(ParserFeature.UNORDERED_LIST)
            ) {
                const listNode = this.tryParseUnorderedList();
                if (listNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(listNode);

                    if (this.peek('\n')) {
                        this.index++;
                    }
                    continue;
                }
            }

            if (
                char === '*' &&
                (this.has(ParserFeature.BOLD) ||
                    this.has(ParserFeature.ITALIC) ||
                    this.has(ParserFeature.BOLD_ITALIC))
            ) {
                const formatNode = this.tryParseFormatting();
                if (formatNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(formatNode);
                    continue;
                }
            }

            if (
                char === '_' &&
                this.has(ParserFeature.DOUBLE_UNDERLINE) &&
                this.peek('___')
            ) {
                const doubleUnderlineNode = this.tryParseDoubleUnderline();
                if (doubleUnderlineNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(doubleUnderlineNode);
                    continue;
                }
            }

            if (
                char === '_' &&
                this.has(ParserFeature.UNDERLINE) &&
                this.peek('__')
            ) {
                const underlineNode = this.tryParseUnderline();
                if (underlineNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(underlineNode);
                    continue;
                }
            }

            if (
                char === '_' &&
                this.has(ParserFeature.DOUBLE_CURLY_UNDERLINE) &&
                this.peek('_~~')
            ) {
                const doubleCurlyUnderlineNode =
                    this.tryParseDoubleCurlyUnderline();
                if (doubleCurlyUnderlineNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(doubleCurlyUnderlineNode);
                    continue;
                }
            }

            if (
                char === '_' &&
                this.has(ParserFeature.CURLY_UNDERLINE) &&
                this.peek('_~')
            ) {
                const curlyUnderlineNode = this.tryParseCurlyUnderline();
                if (curlyUnderlineNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(curlyUnderlineNode);
                    continue;
                }
            }

            if (
                char === '_' &&
                this.has(ParserFeature.RHYTHM_UNDERLINE) &&
                this.peek('_-.')
            ) {
                const rhythmUnderlineNode = this.tryParseRhythmUnderline();
                if (rhythmUnderlineNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(rhythmUnderlineNode);
                    continue;
                }
            }

            if (
                char === '_' &&
                this.has(ParserFeature.DOTTED_UNDERLINE) &&
                this.peek('_.')
            ) {
                const dottedUnderlineNode = this.tryParseDottedUnderline();
                if (dottedUnderlineNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(dottedUnderlineNode);
                    continue;
                }
            }

            if (
                char === '_' &&
                this.has(ParserFeature.DASHED_UNDERLINE) &&
                this.peek('_-')
            ) {
                const dashedUnderlineNode = this.tryParseDashedUnderline();
                if (dashedUnderlineNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(dashedUnderlineNode);
                    continue;
                }
            }

            if (
                char === '_' &&
                this.has(ParserFeature.JAGGED_UNDERLINE) &&
                this.peek('_^')
            ) {
                const jaggedUnderlineNode = this.tryParseJaggedUnderline();
                if (jaggedUnderlineNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(jaggedUnderlineNode);
                    continue;
                }
            }

            if (
                char === '~' &&
                this.has(ParserFeature.STRIKETHROUGH) &&
                this.peek('~~')
            ) {
                const strikethroughNode = this.tryParseStrikethrough();
                if (strikethroughNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(strikethroughNode);
                    continue;
                }
            }

            if (char === '~' && this.has(ParserFeature.SUBSCRIPT)) {
                const subscriptNode = this.tryParseSubscript();
                if (subscriptNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(subscriptNode);
                    continue;
                }
            }

            if (char === '^' && this.has(ParserFeature.SUPERSCRIPT)) {
                const superscriptNode = this.tryParseSuperscript();
                if (superscriptNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(superscriptNode);
                    continue;
                }
            }

            if (
                char === '<' &&
                this.has(ParserFeature.MENTION) &&
                this.peek("<userid:'")
            ) {
                const mentionNode = this.tryParseMention();
                if (mentionNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(mentionNode);
                    continue;
                }
            }

            if (
                char === '<' &&
                this.has(ParserFeature.ROLE_MENTION) &&
                this.peek("<roleid:'")
            ) {
                const roleMentionNode = this.tryParseRoleMention();
                if (roleMentionNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(roleMentionNode);
                    continue;
                }
            }

            if (
                char === '<' &&
                this.has(ParserFeature.EVERYONE_MENTION) &&
                this.peek('<everyone>')
            ) {
                const everyoneNode = this.tryParseEveryoneMention();
                if (everyoneNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(everyoneNode);
                    continue;
                }
            }

            if (
                char === 'h' &&
                this.has(ParserFeature.CHANNEL_LINK) &&
                (this.peek('http://') || this.peek('https://'))
            ) {
                const channelLinkNode = this.tryParseChannelLink();
                if (channelLinkNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(channelLinkNode);
                    continue;
                }
            }

            if (
                char === 'h' &&
                this.has(ParserFeature.INVITE) &&
                (this.peek('http://') || this.peek('https://'))
            ) {
                const inviteNode = this.tryParseInvite();
                if (inviteNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(inviteNode);
                    continue;
                }
            }

            if (
                char === 'h' &&
                this.has(ParserFeature.LINK) &&
                (this.peek('http://') || this.peek('https://'))
            ) {
                const linkNode = this.tryParseLink();
                if (linkNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(linkNode);
                    continue;
                }
            }

            if (char === '-' && this.has(ParserFeature.THEMATIC_BREAK)) {
                const breakNode = this.tryParseThematicBreak();
                if (breakNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(breakNode);
                    continue;
                }
            }

            if (
                (char === '#' || (char === '-' && this.peek('-#'))) &&
                (this.has(ParserFeature.H1) ||
                    this.has(ParserFeature.H2) ||
                    this.has(ParserFeature.H3) ||
                    this.has(ParserFeature.SUBTEXT))
            ) {
                const headingNode = this.tryParseHeading();
                if (headingNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(headingNode);
                    continue;
                }
            }

            if (
                ((char >= '0' && char <= '9') || char === ' ') &&
                this.has(ParserFeature.ORDERED_LIST)
            ) {
                const listNode = this.tryParseOrderedList();
                if (listNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(listNode);

                    if (this.peek('\n')) {
                        this.index++;
                    }
                    continue;
                }
            }

            if (
                char === '|' &&
                this.has(ParserFeature.TABLE) &&
                (this.index === 0 || this.text[this.index - 1] === '\n')
            ) {
                const tableNode = this.tryParseTable();
                if (tableNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(tableNode);
                    continue;
                }
            }

            // ||text||
            if (
                char === '|' &&
                this.has(ParserFeature.SPOILER) &&
                this.peek('||')
            ) {
                const spoilerNode = this.tryParseSpoiler();
                if (spoilerNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(spoilerNode);
                    continue;
                }
            }

            if (
                char === '`' &&
                (this.has(ParserFeature.INLINE_CODE) ||
                    this.has(ParserFeature.CODE_BLOCK) ||
                    this.has(ParserFeature.MERMAID))
            ) {
                const codeNode = this.tryParseCode();
                if (codeNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(codeNode);
                    continue;
                }
            }

            if (
                char === '$' &&
                (this.has(ParserFeature.INLINE_LATEX) ||
                    this.has(ParserFeature.LATEX))
            ) {
                const latexNode = this.tryParseLatex();
                if (latexNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(latexNode);
                    continue;
                }
            }

            if (
                char === ':' &&
                this.has(ParserFeature.ADMONITION) &&
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

            if (
                char === '>' &&
                (this.has(ParserFeature.BLOCKQUOTE) ||
                    this.has(ParserFeature.ADMONITION)) &&
                (this.index === 0 || this.text[this.index - 1] === '\n')
            ) {
                const blockquoteNode = this.tryParseBlockquote();
                if (blockquoteNode) {
                    currentText = this.flushText(nodes, currentText);
                    nodes.push(blockquoteNode);
                    continue;
                }
            }

            currentText += char;
            this.index++;
        }

        currentText = this.flushText(nodes, currentText);

        return nodes;
    }

    private flushText(nodes: ASTNode[], currentText: string): string {
        if (currentText) {
            const finalContent = this.options.enableCensorship
                ? censorText(currentText)
                : currentText;
            nodes.push({ type: 'text', content: finalContent });
        }
        return '';
    }

    private peek(str: string): boolean {
        return this.text.startsWith(str, this.index);
    }

    private tryParseUnicodeEmoji(): ASTNode | null {
        // Optimization: use slice to create a substring for matching
        const remaining = this.text.slice(this.index);
        const match = remaining.match(STARTS_WITH_EMOJI_REGEX);

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

    private tryParseTimestamp(): ASTNode | null {
        const start = this.index;
        this.index += 3; // skip '<t:'

        let rawTimestamp = '';
        if (this.text[this.index] === '-') {
            rawTimestamp += '-';
            this.index++;
        }

        while (this.index < this.text.length) {
            const c = this.text[this.index];
            if (c >= '0' && c <= '9') {
                rawTimestamp += c;
                this.index++;
                continue;
            }
            break;
        }

        if (rawTimestamp === '' || rawTimestamp === '-') {
            this.index = start;
            return null;
        }

        let flag: 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R' | undefined;
        if (this.text[this.index] === ':') {
            const rawFlag = this.text[this.index + 1];
            if (
                rawFlag === 't' ||
                rawFlag === 'T' ||
                rawFlag === 'd' ||
                rawFlag === 'D' ||
                rawFlag === 'f' ||
                rawFlag === 'F' ||
                rawFlag === 'R'
            ) {
                flag = rawFlag;
                this.index += 2;
            } else {
                this.index = start;
                return null;
            }
        }

        if (this.text[this.index] !== '>') {
            this.index = start;
            return null;
        }

        this.index++;
        return {
            type: 'timestamp',
            timestamp: Number(rawTimestamp),
            flag,
        };
    }

    private tryParseFormatting(): ASTNode | null {
        const start = this.index;
        let starCount = 0;

        while (
            this.index < this.text.length &&
            this.text[this.index] === '*' &&
            starCount < 3
        ) {
            starCount++;
            this.index++;
        }

        if (starCount === 0) return null;

        if (starCount === 3 && !this.has(ParserFeature.BOLD_ITALIC)) {
            this.index = start;
            return null;
        }
        if (starCount === 2 && !this.has(ParserFeature.BOLD)) {
            this.index = start;
            return null;
        }
        if (starCount === 1 && !this.has(ParserFeature.ITALIC)) {
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
        if (this.index > 0 && this.text[this.index - 1] !== '\n') {
            return null;
        }

        const start = this.index;

        if (this.peek('### ') && this.has(ParserFeature.H3)) {
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
                    content: this.parseContent(content.trim(), [
                        ParserFeature.ORDERED_LIST,
                        ParserFeature.UNORDERED_LIST,
                    ]),
                } as ASTNode;
            }
        } else if (this.peek('## ') && this.has(ParserFeature.H2)) {
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
                    content: this.parseContent(content.trim(), [
                        ParserFeature.ORDERED_LIST,
                        ParserFeature.UNORDERED_LIST,
                    ]),
                } as ASTNode;
            }
        } else if (this.peek('# ') && this.has(ParserFeature.H1)) {
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
                    content: this.parseContent(content.trim(), [
                        ParserFeature.ORDERED_LIST,
                        ParserFeature.UNORDERED_LIST,
                    ]),
                } as ASTNode;
            }
        } else if (this.peek('-# ') && this.has(ParserFeature.SUBTEXT)) {
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
                    content: this.parseContent(content.trim(), [
                        ParserFeature.ORDERED_LIST,
                        ParserFeature.UNORDERED_LIST,
                    ]),
                } as ASTNode;
            }
        }

        this.index = start;
        return null;
    }

    private tryParseSpoiler(): ASTNode | null {
        const start = this.index;
        this.index += 2;

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
            this.index += 2;
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

        if (this.peek('```')) {
            this.index += 3;
            let language = '';

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

                if (lang === 'mermaid' && this.has(ParserFeature.MERMAID)) {
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
        const baseUrlPattern = getBaseUrlPattern();
        const inviteRegex = new RegExp(
            `^${baseUrlPattern}/invite/([a-zA-Z0-9_-]+)`,
        );
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

        if (url !== '') {
            const klipyRegex =
                /^https?:\/\/(?:www\.)?klipy\.com\/(?:g|gifs|stickers)\/([a-zA-Z0-9_-]+)/;
            const klipyMatch = url.match(klipyRegex);

            if (klipyMatch && this.has(ParserFeature.KLIPY)) {
                return { type: 'klipy', klipyId: klipyMatch[1], url };
            }

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

    private tryParseChecklist(): ASTNode | null {
        const start = this.index;

        if (this.index > 0 && this.text[this.index - 1] !== '\n') {
            return null;
        }

        const remaining = this.text.slice(this.index);
        const match = remaining.match(/^( *)[-*+] \[([ xX])\] /);
        if (!match) return null;

        const indentation = match[1].length;
        const checked = match[2].toLowerCase() === 'x';
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
                type: 'checklist',
                checked,
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
            .map((cell): string => cell.trim());

        // Check if all separator cells are dashes (with optional colons for alignment)
        const isValidSeparator = separatorCells.every((cell): boolean =>
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
            .map((header): string | ASTNode[] =>
                this.parseContent(header.trim()),
            );

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

            const parsedCells = cells.map((cell): string | ASTNode[] =>
                this.parseContent(cell),
            );

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

    private parseContent(
        content: string,
        excludedFeatures?: ParserFeatureType[],
    ): string | ASTNode[] {
        let options = this.options;
        if (excludedFeatures && excludedFeatures.length > 0) {
            options = {
                ...this.options,
                features: this.options.features.filter(
                    (f): boolean => !excludedFeatures.includes(f),
                ),
            };
        }
        const nodes = parseText(content, options);
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
        const baseUrlPattern = getBaseUrlPattern();
        const channelLinkRegex = new RegExp(
            `^${baseUrlPattern}/chat/@server/([a-zA-Z0-9]+)/channel/([a-zA-Z0-9]+)(?:/message/([a-zA-Z0-9]+))?`,
        );
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
        if (this.has(ParserFeature.LATEX) && this.peek('$\n')) {
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
        if (this.has(ParserFeature.INLINE_LATEX) && this.peek('$$')) {
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

    private tryParseCurlyUnderline(): ASTNode | null {
        const start = this.index;
        this.index += 2; // skip '_~'

        let content = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            if (this.peek('~_')) {
                foundClosing = true;
                break;
            }
            content += this.text[this.index];
            this.index++;
        }

        if (foundClosing && content) {
            this.index += 2; // skip '~_'
            return {
                type: 'curly_underline',
                content: this.parseContent(content),
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseDoubleCurlyUnderline(): ASTNode | null {
        const start = this.index;
        this.index += 3; // skip '_~~'

        let content = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            if (this.peek('~~_')) {
                foundClosing = true;
                break;
            }
            content += this.text[this.index];
            this.index++;
        }

        if (foundClosing && content) {
            this.index += 3; // skip '~~_'
            return {
                type: 'double_curly_underline',
                content: this.parseContent(content),
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseDashedUnderline(): ASTNode | null {
        const start = this.index;
        this.index += 2; // skip '_-'

        let content = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            if (this.peek('-_')) {
                foundClosing = true;
                break;
            }
            content += this.text[this.index];
            this.index++;
        }

        if (foundClosing && content) {
            this.index += 2; // skip '-_'
            return {
                type: 'dashed_underline',
                content: this.parseContent(content),
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseDottedUnderline(): ASTNode | null {
        const start = this.index;
        this.index += 2; // skip '_.'

        let content = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            if (this.peek('._')) {
                foundClosing = true;
                break;
            }
            content += this.text[this.index];
            this.index++;
        }

        if (foundClosing && content) {
            this.index += 2; // skip '._'
            return {
                type: 'dotted_underline',
                content: this.parseContent(content),
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseRhythmUnderline(): ASTNode | null {
        const start = this.index;
        this.index += 3; // skip '_-.'

        let content = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            if (this.peek('.-_')) {
                foundClosing = true;
                break;
            }
            content += this.text[this.index];
            this.index++;
        }

        if (foundClosing && content) {
            this.index += 3; // skip '.-_'
            return {
                type: 'rhythm_underline',
                content: this.parseContent(content),
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseSuperscript(): ASTNode | null {
        const start = this.index;
        this.index += 1; // skip '^'

        let firstPart = '';
        let secondPart = '';
        let hasPipe = false;
        let foundClosing = false;

        while (this.index < this.text.length) {
            const char = this.text[this.index];
            if (char === '^') {
                foundClosing = true;
                break;
            }
            if (char === '|' && !hasPipe) {
                hasPipe = true;
                this.index++;
                continue;
            }
            if (char === '\n') {
                break; // No multiline superscript
            }
            if (hasPipe) {
                secondPart += char;
            } else {
                firstPart += char;
            }
            this.index++;
        }

        if (foundClosing && (firstPart || secondPart)) {
            this.index += 1; // skip '^'
            if (hasPipe && this.has(ParserFeature.STACKED_SCRIPT)) {
                return {
                    type: 'stacked_script',
                    sup: this.parseContent(firstPart),
                    sub: this.parseContent(secondPart),
                } as ASTNode;
            }
            return {
                type: 'superscript',
                content: this.parseContent(
                    firstPart + (hasPipe ? '|' : '') + secondPart,
                ),
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseSubscript(): ASTNode | null {
        const start = this.index;
        this.index += 1; // skip '~'

        let content = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            if (this.text[this.index] === '~') {
                foundClosing = true;
                break;
            }
            if (this.text[this.index] === '\n') {
                break; // No multiline subscript
            }
            content += this.text[this.index];
            this.index++;
        }

        if (foundClosing && content) {
            this.index += 1; // skip '~'
            return {
                type: 'subscript',
                content: this.parseContent(content),
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseJaggedUnderline(): ASTNode | null {
        const start = this.index;
        this.index += 2; // skip '_^'

        let content = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            if (this.peek('^_')) {
                foundClosing = true;
                break;
            }
            content += this.text[this.index];
            this.index++;
        }

        if (foundClosing && content) {
            this.index += 2; // skip '^_'
            return {
                type: 'jagged_underline',
                content: this.parseContent(content),
            } as ASTNode;
        }

        this.index = start;
        return null;
    }

    private tryParseDoubleUnderline(): ASTNode | null {
        const start = this.index;
        this.index += 3; // skip '___'

        let content = '';
        let foundClosing = false;

        while (this.index < this.text.length) {
            if (this.peek('___')) {
                foundClosing = true;
                break;
            }
            content += this.text[this.index];
            this.index++;
        }

        if (foundClosing && content) {
            this.index += 3; // skip '___'
            return {
                type: 'double_underline',
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
                if (this.has(ParserFeature.ADMONITION)) {
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

                if (this.has(ParserFeature.BLOCKQUOTE)) {
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
