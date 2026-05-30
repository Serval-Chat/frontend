/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { SendMessageInteractionMetadataDTO } from './SendMessageInteractionMetadataDTO';
import type { SendMessagePollDTO } from './SendMessagePollDTO';

export type SendMessageRequestDTO = {
    /**
     * Message content (preferred)
     */
    content?: string;
    /**
     * Message text (legacy support)
     */
    text?: string;
    /**
     * ID of the message being replied to
     */
    replyToId?: string;
    /**
     * Rich embeds for the message
     */
    embeds?: Array<string>;
    /**
     * Structured file attachments
     */
    attachments?: Array<string>;
    /**
     * Slash command interaction metadata
     */
    interaction?: SendMessageInteractionMetadataDTO;
    /**
     * Sticker ID
     */
    stickerId?: string;
    /**
     * Poll details
     */
    poll?: SendMessagePollDTO;
    /**
     * Disable link embedding scraper
     */
    noEmbeds?: boolean;
};
