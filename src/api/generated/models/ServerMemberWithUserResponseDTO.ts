/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ServerMemberWithUserResponseDTO = {
    id: string;
    serverId: string;
    userId: string;
    roles: Array<string>;
    nickname?: Record<string, any> | null;
    communicationDisabledUntil?: Record<string, any> | null;
    joinedAt?: string;
    createdAt?: string;
    updatedAt?: string;
    user: Record<string, any> | null;
};
