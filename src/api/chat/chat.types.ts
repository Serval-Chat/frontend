import type { ButtonComponent, Embed } from '@/types/embed';
import type { InteractionValue } from '@/types/interactions';

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

export type MessageAttachmentType =
    | 'image'
    | 'video'
    | 'audio'
    | 'text'
    | 'file';

export interface MessageAttachment {
    attachmentId: string;
    type: MessageAttachmentType;
    mimeType: string;
    name: string;
    size: number;
    width?: number;
    height?: number;
    spoiler?: boolean;
}

export interface MessagePollOption {
    id: string;
    text: string;
    emoji?: string;
    emojiType?: 'unicode' | 'custom';
    emojiId?: string;
    votes: string[]; // List of user IDs
}

export interface MessagePoll {
    title: string;
    options: MessagePollOption[];
    multiSelect: boolean;
    expiresAt?: string;
}

export interface OutgoingPollOption {
    text: string;
    emoji?: string;
    emojiType?: 'unicode' | 'custom';
    emojiId?: string;
}

export interface OutgoingPoll {
    title: string;
    options: OutgoingPollOption[];
    multiSelect: boolean;
    expiresAt?: string;
}

export interface ChatMessage {
    id: string;
    text: string;
    createdAt: string;
    senderId: string;
    senderUsername?: string;
    senderProfilePicture?: string | null;
    serverId?: string;
    channelId?: string;
    receiverId?: string; // For DMs
    replyToId?: string;
    stickerId: string | null;
    repliedToMessageId?: string | ChatMessage;
    repliedTo?: {
        messageId: string;
        senderId: string;
        senderUsername?: string;
        text: string;
    };
    referenced_message?: ChatMessage;
    isEdited: boolean;
    editedAt?: string;
    isPinned: boolean;
    isSticky: boolean;
    isWebhook: boolean;
    webhookUsername?: string;
    webhookAvatarUrl?: string;
    embeds: Embed[];
    components?: ButtonComponent[];
    attachments: MessageAttachment[];
    reactions: MessageReaction[];
    interaction: {
        command: string;
        options: { name: string; value: InteractionValue }[];
        user: { id: string; username: string };
    } | null;
    poll: MessagePoll | null;
    senderIsBot: boolean;
    deletedAt?: string;
    isEphemeral?: boolean;
    invocationId?: string;
}
