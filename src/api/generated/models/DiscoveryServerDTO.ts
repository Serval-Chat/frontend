/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { DiscoveryServerBannerDTO } from './DiscoveryServerBannerDTO';

export type DiscoveryServerDTO = {
    id: string;
    name: string;
    description: string;
    icon?: string;
    banner?: DiscoveryServerBannerDTO;
    verified: boolean;
    tags: Array<string>;
    memberCount: number;
    inviteCode: string;
};
