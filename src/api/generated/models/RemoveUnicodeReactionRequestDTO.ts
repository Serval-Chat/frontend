/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type RemoveUnicodeReactionRequestDTO = {
    emoji: string;
    scope?: RemoveUnicodeReactionRequestDTO.scope;
};
export namespace RemoveUnicodeReactionRequestDTO {
    export enum scope {
        ME = 'me',
        ALL = 'all',
    }
}
