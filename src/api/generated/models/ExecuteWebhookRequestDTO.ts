/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type ExecuteWebhookRequestDTO = {
    /**
     * Message content
     */
    content?: string;
    /**
     * Custom username for the webhook
     */
    username?: string;
    /**
     * Custom avatar URL for the webhook
     */
    avatarUrl?: string;
    /**
     * Rich embeds for the message
     */
    embeds?: Array<string>;
    /**
     * URLs that should not generate embeds
     */
    noEmbedsUrls?: Array<string>;
};
