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
            ParserFeature.LINK,
        ],
    },
    BIO: {
        features: [
            ParserFeature.BOLD,
            ParserFeature.ITALIC,
            ParserFeature.BOLD_ITALIC,
            ParserFeature.EMOJI,
            ParserFeature.LINK,
        ],
    },
} as const;

export class TextParser {
    private text: string;
    private index: number = 0;
    private options: ParserOptions;

    constructor(text: string, options: ParserOptions) {
        this.text = text;
        this.options = options;
    }

    public parse(): ASTNode[] {
        const nodes: ASTNode[] = [];
        let currentText = '';

        while (this.index < this.text.length) {
            const char = this.text[this.index];

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
