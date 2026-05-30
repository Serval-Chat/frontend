/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type BotInteractionRespondDTO = {
    /**
     * ID of the server where the interaction occurred
     */
    serverId: string;
    /**
     * ID of the channel where the interaction occurred
     */
    channelId: string;
    /**
     * ID of the user who triggered the interaction
     */
    senderId: string;
    /**
     * Text content of the response
     */
    text?: string;
    /**
     * Rich embeds to include in the response
     */
    embeds?: Array<string>;
    /**
     * ID of the invocation message to link against
     */
    invocationId?: string;
    /**
     * When true, only the invoking user sees the response
     */
    ephemeral?: boolean;
};
