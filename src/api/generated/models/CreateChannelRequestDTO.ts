/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MarkdownBlockadeRuleDTO } from './MarkdownBlockadeRuleDTO';

export type CreateChannelRequestDTO = {
    name: string;
    type?: CreateChannelRequestDTO.type;
    position?: number;
    categoryId?: string;
    description?: string;
    icon?: string;
    emoji?: string;
    emojiType?: CreateChannelRequestDTO.emojiType;
    link?: string;
    /**
     * Cooldown between messages in seconds
     */
    slowMode?: number;
    /**
     * Map of role/user IDs to permission overrides
     */
    permissions?: Record<string, any>;
    markdownBlockadeRules?: Array<MarkdownBlockadeRuleDTO>;
};
export namespace CreateChannelRequestDTO {
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
