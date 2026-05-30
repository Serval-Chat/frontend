/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminUserServerInfoDTO } from './AdminUserServerInfoDTO';

export type AdminExtendedUserDetailsDTO = {
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
    bio: string;
    pronouns: string;
    banner: Record<string, any> | null;
    deletedAt?: string;
    deletedReason?: string;
    servers: Array<AdminUserServerInfoDTO>;
};
