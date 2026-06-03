/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MessageAttachmentResponseDTO } from './MessageAttachmentResponseDTO';
import type { MessageReactionDTO } from './MessageReactionDTO';

export type ServerMessageResponseDTO = {
    id: string;
    serverId: string;
    channelId: string;
    senderId: string;
    text: string;
    createdAt: string;
    editedAt?: string;
    isEdited: boolean;
    isPinned: boolean;
    isSticky: boolean;
    isWebhook: boolean;
    webhookUsername?: string;
    webhookAvatarUrl?: string;
    replyToId?: string;
    reactions: Array<MessageReactionDTO>;
    attachments: Array<MessageAttachmentResponseDTO>;
    embeds: Array<Record<string, any>>;
    stickerId?: string;
    deletedAt?: string;
    interaction: Record<string, any> | null;
    poll: Record<string, any> | null;
};
