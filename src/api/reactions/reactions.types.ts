import type { MessageReaction } from '@/api/chat/chat.types';

export const EmojiType = {
    UNICODE: 'unicode',
    CUSTOM: 'custom',
} as const;

export type EmojiType = (typeof EmojiType)[keyof typeof EmojiType];

export const ReactionScope = {
    ME: 'me',
    ALL: 'all',
} as const;

export type ReactionScope = (typeof ReactionScope)[keyof typeof ReactionScope];

export interface AddReactionRequest {
    emoji: string;
    emojiType: EmojiType | 'unicode' | 'custom';
    emojiId?: string;
}

export interface RemoveReactionRequest {
    emoji?: string;
    emojiId?: string;
    scope?: ReactionScope | 'me' | 'all';
}

export interface ReactionsResponse {
    reactions: MessageReaction[];
}
