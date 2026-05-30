/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MessageAttachmentResponseDTO = {
    attachmentId: string;
    type: MessageAttachmentResponseDTO.type;
    mimeType: string;
    name: string;
    size: number;
    width?: number;
    height?: number;
    spoiler?: boolean;
};
export namespace MessageAttachmentResponseDTO {
    export enum type {
        IMAGE = 'image',
        VIDEO = 'video',
        AUDIO = 'audio',
        TEXT = 'text',
        FILE = 'file',
    }
}
