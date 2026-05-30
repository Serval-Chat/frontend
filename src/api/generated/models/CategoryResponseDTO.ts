/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { ChannelPermissionsMapDTO } from './ChannelPermissionsMapDTO';

export type CategoryResponseDTO = {
    _id?: string;
    serverId: string;
    name: string;
    position: number;
    permissions?: ChannelPermissionsMapDTO;
    createdAt?: string;
    updatedAt?: string;
};
