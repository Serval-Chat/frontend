/**
 * @description Text parser types
 */

export const ParserFeature = {
    BOLD: 'BOLD',
    ITALIC: 'ITALIC',
    BOLD_ITALIC: 'BOLD_ITALIC',
    EMOJI: 'EMOJI',
    LINK: 'LINK',
} as const;

export type ParserFeature = (typeof ParserFeature)[keyof typeof ParserFeature];

export type ASTNodeType =
    | 'text'
    | 'bold'
    | 'italic'
    | 'bold_italic'
    | 'emoji'
    | 'link';

export interface TextNode {
    type: 'text';
    content: string;
}

export interface BoldNode {
    type: 'bold';
    content: string;
}

export interface ItalicNode {
    type: 'italic';
    content: string;
}

export interface BoldItalicNode {
    type: 'bold_italic';
    content: string;
}

export interface EmojiNode {
    type: 'emoji';
    emojiId: string;
}

export interface LinkNode {
    type: 'link';
    url: string;
    text?: string;
}

export type ASTNode =
    | TextNode
    | BoldNode
    | ItalicNode
    | BoldItalicNode
    | EmojiNode
    | LinkNode;
