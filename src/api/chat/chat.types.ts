export interface UnicodeReactionData {
    emoji: string;
    emojiType: 'unicode';
    count: number;
    users: string[]; // List of user IDs
}

export interface CustomReactionData {
    emoji: string;
    emojiType: 'custom';
    emojiId: string;
    count: number;
    users: string[]; // List of user IDs
    emojiName?: string;
    emojiUrl?: string;
}

export type MessageReaction = UnicodeReactionData | CustomReactionData;

export interface ChatMessage {
    _id: string;
    text: string;
    createdAt: string;
    senderId: string;
    serverId?: string;
    channelId?: string;
    receiverId?: string; // For DMs
    replyToId?: string;
    repliedToMessageId?: string;
    isEdited?: boolean;
    editedAt?: string;
    isWebhook?: boolean;
    webhookUsername?: string;
    webhookAvatarUrl?: string;
    reactions?: MessageReaction[];
}
