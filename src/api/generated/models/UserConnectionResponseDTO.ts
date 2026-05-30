/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UserConnectionResponseDTO = {
    id: string;
    type: UserConnectionResponseDTO.type;
    value: string;
    status?: UserConnectionResponseDTO.status;
    recordType?: string;
    recordName?: string;
    recordValue?: string;
    filePath?: string;
    fileUrl?: string;
    fileContent?: string;
    expiresAt?: string;
};
export namespace UserConnectionResponseDTO {
    export enum type {
        WEBSITE = 'Website',
    }
    export enum status {
        PENDING = 'pending',
        VERIFIED = 'verified',
    }
}
