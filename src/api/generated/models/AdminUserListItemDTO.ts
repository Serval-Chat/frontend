/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type AdminUserListItemDTO = {
    _id: string;
    username: string;
    login: string;
    displayName: Record<string, any> | null;
    profilePicture: Record<string, any> | null;
    permissions: Record<string, any>;
    createdAt: string;
    banExpiry?: string;
    muteExpiry?: string;
    muteActive: boolean;
    muteReason?: string;
    warningCount: number;
    badges: Array<string>;
};
