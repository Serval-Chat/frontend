/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type PingExportMessageDTO = {
    _id: string;
    text: string;
    type: PingExportMessageDTO.type;
};
export namespace PingExportMessageDTO {
    export enum type {
        SUCCESS = 'success',
        FAILURE = 'failure',
        CANCELLED = 'cancelled',
    }
}
