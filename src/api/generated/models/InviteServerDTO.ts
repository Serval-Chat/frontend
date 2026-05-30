/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { InviteServerBannerDTO } from './InviteServerBannerDTO';

export type InviteServerDTO = {
    id: string;
    name: string;
    icon?: string;
    banner?: InviteServerBannerDTO;
    verified?: boolean;
    tags?: Array<string>;
};
