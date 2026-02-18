/**
 * @description Text parser types
 */

export const ParserFeature = {
    BOLD: 'BOLD',
    ITALIC: 'ITALIC',
    BOLD_ITALIC: 'BOLD_ITALIC',
    EMOJI: 'EMOJI',
    LINK: 'LINK',
    H1: 'H1',
    H2: 'H2',
    H3: 'H3',
    SUBTEXT: 'SUBTEXT',
    SPOILER: 'SPOILER',
    INLINE_CODE: 'INLINE_CODE',
    CODE_BLOCK: 'CODE_BLOCK',
    INVITE: 'INVITE',
    FILE: 'FILE',
    MENTION: 'MENTION',
    ROLE_MENTION: 'ROLE_MENTION',
    UNICODE_EMOJI: 'UNICODE_EMOJI',
    EVERYONE_MENTION: 'EVERYONE_MENTION',
    ORDERED_LIST: 'ORDERED_LIST',
} as const;

export type ParserFeature = (typeof ParserFeature)[keyof typeof ParserFeature];

export type ASTNodeType =
    | 'text'
    | 'bold'
    | 'italic'
    | 'bold_italic'
    | 'emoji'
    | 'unicode_emoji'
    | 'link'
    | 'h1'
    | 'h2'
    | 'h3'
    | 'subtext'
    | 'spoiler'
    | 'inline_code'
    | 'code_block'
    | 'invite'
    | 'file'
    | 'mention'
    | 'role_mention'
    | 'everyone'
    | 'ordered_list';

export interface TextNode {
    type: 'text';
    content: string;
}

export interface BoldNode {
    type: 'bold';
    content: string | ASTNode[];
}

export interface ItalicNode {
    type: 'italic';
    content: string | ASTNode[];
}

export interface BoldItalicNode {
    type: 'bold_italic';
    content: string | ASTNode[];
}

export interface EmojiNode {
    type: 'emoji';
    emojiId: string;
}

export interface UnicodeEmojiNode {
    type: 'unicode_emoji';
    content: string; // The unicode character(s)
}

export interface LinkNode {
    type: 'link';
    url: string;
    text?: string;
}

export interface H1Node {
    type: 'h1';
    content: string | ASTNode[];
}

export interface H2Node {
    type: 'h2';
    content: string | ASTNode[];
}

export interface H3Node {
    type: 'h3';
    content: string | ASTNode[];
}

export interface SubtextNode {
    type: 'subtext';
    content: string | ASTNode[];
}

export interface SpoilerNode {
    type: 'spoiler';
    content: string | ASTNode[];
}

export interface InlineCodeNode {
    type: 'inline_code';
    content: string;
}

export interface CodeBlockNode {
    type: 'code_block';
    content: string;
    language?: string;
}

export interface InviteNode {
    type: 'invite';
    code: string;
    url: string;
}

export interface FileNode {
    type: 'file';
    url: string;
    content?: string;
}

export interface MentionNode {
    type: 'mention';
    userId: string;
}

export interface RoleMentionNode {
    type: 'role_mention';
    roleId: string;
}

export interface EveryoneNode {
    type: 'everyone';
}

export interface OrderedListNode {
    type: 'ordered_list';
    number: string;
    content: string | ASTNode[];
}

export type ASTNode =
    | TextNode
    | BoldNode
    | ItalicNode
    | BoldItalicNode
    | EmojiNode
    | UnicodeEmojiNode
    | LinkNode
    | H1Node
    | H2Node
    | H3Node
    | SubtextNode
    | SpoilerNode
    | InlineCodeNode
    | CodeBlockNode
    | InviteNode
    | FileNode
    | MentionNode
    | RoleMentionNode
    | EveryoneNode
    | OrderedListNode;
