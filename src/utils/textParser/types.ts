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
    CHANNEL_LINK: 'CHANNEL_LINK',
    ORDERED_LIST: 'ORDERED_LIST',
    TABLE: 'TABLE',
    LATEX: 'LATEX',
    INLINE_LATEX: 'INLINE_LATEX',
    THEMATIC_BREAK: 'THEMATIC_BREAK',
    UNDERLINE: 'UNDERLINE',
    STRIKETHROUGH: 'STRIKETHROUGH',
    BLOCKQUOTE: 'BLOCKQUOTE',
    ADMONITION: 'ADMONITION',
    MERMAID: 'MERMAID',
    UNORDERED_LIST: 'UNORDERED_LIST',
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
    | 'channel_link'
    | 'ordered_list'
    | 'table'
    | 'latex'
    | 'inline_latex'
    | 'thematic_break'
    | 'underline'
    | 'strikethrough'
    | 'blockquote'
    | 'admonition'
    | 'mermaid'
    | 'unordered_list';

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

export interface UnderlineNode {
    type: 'underline';
    content: string | ASTNode[];
}

export interface StrikethroughNode {
    type: 'strikethrough';
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

export interface MermaidNode {
    type: 'mermaid';
    content: string;
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

export interface ChannelLinkNode {
    type: 'channel_link';
    serverId: string;
    channelId: string;
    url: string;
    messageId?: string;
}

export interface OrderedListNode {
    type: 'ordered_list';
    number: string;
    content: string | ASTNode[];
    depth?: number;
}

export interface UnorderedListNode {
    type: 'unordered_list';
    content: string | ASTNode[];
    depth?: number;
}

export interface TableNode {
    type: 'table';
    headers: (string | ASTNode[])[];
    rows: (string | ASTNode[])[][];
}

export interface LatexNode {
    type: 'latex';
    content: string;
}

export interface InlineLatexNode {
    type: 'inline_latex';
    content: string;
}

export interface ThematicBreakNode {
    type: 'thematic_break';
}

export interface BlockquoteNode {
    type: 'blockquote';
    content: string | ASTNode[];
    multiline?: boolean;
}

export type AdmonitionStyle = 'github' | 'obsidian' | 'myst';

export interface AdmonitionNode {
    type: 'admonition';
    style: AdmonitionStyle;
    /** Normalized lowercase type, e.g. 'note', 'warning' */
    admonitionType: string;
    /** Custom title (Obsidian/MyST). When undefined, the renderer uses admonitionType. */
    title?: string;
    /** Obsidian only: whether the callout has a fold toggle */
    collapsible?: boolean;
    /** Obsidian only: true = expanded by default (+), false = collapsed (-) */
    defaultOpen?: boolean;
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
    | ChannelLinkNode
    | OrderedListNode
    | TableNode
    | LatexNode
    | InlineLatexNode
    | ThematicBreakNode
    | UnderlineNode
    | StrikethroughNode
    | BlockquoteNode
    | AdmonitionNode
    | MermaidNode
    | UnorderedListNode;
