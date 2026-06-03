/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { AdminChannelShortDTO } from './AdminChannelShortDTO';
import type { AdminServerBannerDTO } from './AdminServerBannerDTO';
import type { AdminServerOwnerDTO } from './AdminServerOwnerDTO';

export type AdminServerDetailsDTO = {
    id: string;
    name: string;
    description?: string;
    icon: Record<string, any> | null;
    banner?: AdminServerBannerDTO;
    ownerId: string;
    memberCount: number;
    messageVolume: number;
    createdAt: string;
    deletedAt?: string;
    owner: AdminServerOwnerDTO | null;
    channels: Array<AdminChannelShortDTO>;
    recentBanCount: number;
    recentKickCount: number;
    verified: boolean;
    verificationScore?: number;
    verificationEligible?: boolean;
    verificationLastComputedAt?: string;
    verificationFailureReasons?: Array<string>;
    verificationOverride?: AdminServerDetailsDTO.verificationOverride;
    verificationRequested: boolean;
    discoveryEnabled: boolean;
};
export namespace AdminServerDetailsDTO {
    export enum verificationOverride {
        VERIFIED = 'verified',
        UNVERIFIED = 'unverified',
    }
}
