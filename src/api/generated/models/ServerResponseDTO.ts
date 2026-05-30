/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { ServerBannerDTO } from './ServerBannerDTO';

export type ServerResponseDTO = {
    _id?: string;
    name: string;
    ownerId: string;
    icon?: string;
    banner?: ServerBannerDTO;
    description?: string;
    discoveryEnabled?: boolean;
    defaultRoleId?: string;
    memberCount?: number;
    allTimeHigh?: number;
    disableCustomFonts?: boolean;
    disableUsernameGlowAndCustomColor?: boolean;
    createdAt?: string;
    updatedAt?: string;
    canManage?: boolean;
};
