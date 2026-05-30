/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MessageReactionDTO = {
    emoji: string;
    type: MessageReactionDTO.type;
    emojiId?: string;
    count: number;
    me: boolean;
};
export namespace MessageReactionDTO {
    export enum type {
        UNICODE = 'unicode',
        CUSTOM = 'custom',
    }
}
