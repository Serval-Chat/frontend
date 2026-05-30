/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RemoveCustomReactionRequestDTO = {
    emojiId: string;
    emoji?: string;
    scope?: RemoveCustomReactionRequestDTO.scope;
};
export namespace RemoveCustomReactionRequestDTO {
    export enum scope {
        ME = 'me',
        ALL = 'all',
    }
}
