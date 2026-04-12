export const BlockFlags = {
    BLOCK_REACTIONS: 1 << 0,
    HIDE_FROM_MEMBER_LIST: 1 << 1,
    HIDE_FROM_MENTIONS: 1 << 2,
    BLOCK_FRIEND_REQUESTS: 1 << 3,
    HIDE_MY_PRESENCE: 1 << 4,

    HIDE_MY_PRONOUNS: 1 << 5,
    HIDE_MY_BIO: 1 << 6,
    HIDE_MY_DISPLAY_NAME: 1 << 7,
    HIDE_MY_AVATAR: 1 << 8,

    HIDE_MESSAGES: 1 << 9,
    SPOILER_MESSAGES: 1 << 9,
    HIDE_REPLIES: 1 << 10,
    HIDE_REPLIES_TO_THEM: 1 << 10,
    HIDE_FROM_TYPING_INDICATORS: 1 << 11,
    HIDE_TYPING: 1 << 11,
    HIDE_THEIR_REACTIONS: 1 << 12,
    HIDE_VOICE_CHANNEL: 1 << 13,
    HIDE_IN_VOICE: 1 << 13,
    HIDE_THEIR_PRESENCE: 1 << 14,

    HIDE_BIO: (1 << 5) | (1 << 6) | (1 << 7) | (1 << 8),
} as const;

export type BlockFlagsType = (typeof BlockFlags)[keyof typeof BlockFlags];
