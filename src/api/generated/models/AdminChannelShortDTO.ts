/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AdminChannelShortDTO = {
    _id: string;
    name: string;
    description?: string;
    type: AdminChannelShortDTO.type;
    position: number;
};
export namespace AdminChannelShortDTO {
    export enum type {
        TEXT = 'text',
        VOICE = 'voice',
        LINK = 'link',
    }
}
