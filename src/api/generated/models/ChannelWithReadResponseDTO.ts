/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { ChannelPermissionsMapDTO } from './ChannelPermissionsMapDTO';

export type ChannelWithReadResponseDTO = {
    id?: string;
    serverId: string;
    name: string;
    type: ChannelWithReadResponseDTO.type;
    description?: string;
    icon?: string;
    emoji?: string;
    emojiType?: ChannelWithReadResponseDTO.emojiType;
    position: number;
    categoryId?: string | null;
    lastMessageAt?: string | null;
    permissions?: ChannelPermissionsMapDTO;
    createdAt?: string;
    updatedAt?: string;
    slowMode?: number;
    slowModeNextMessageAllowedAt?: string | null;
    lastReadAt?: string | null;
};
export namespace ChannelWithReadResponseDTO {
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
