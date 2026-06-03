/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChannelPermissionsMapDTO } from './ChannelPermissionsMapDTO';

export type ChannelResponseDTO = {
    id?: string;
    serverId: string;
    name: string;
    type: ChannelResponseDTO.type;
    description?: string;
    icon?: string;
    emoji?: string;
    emojiType?: ChannelResponseDTO.emojiType;
    position: number;
    categoryId?: string | null;
    lastMessageAt?: string;
    permissions?: ChannelPermissionsMapDTO;
    createdAt?: string;
    updatedAt?: string;
    slowMode?: number;
    slowModeNextMessageAllowedAt?: string | null;
};
export namespace ChannelResponseDTO {
    export enum type {
        TEXT = 'text',
        VOICE = 'voice',
        LINK = 'link',
    }
    export enum emojiType {
        CUSTOM = 'custom',
        UNICODE = 'unicode',
    }
}
