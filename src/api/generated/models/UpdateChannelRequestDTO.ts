/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { MarkdownBlockadeRuleDTO } from './MarkdownBlockadeRuleDTO';

export type UpdateChannelRequestDTO = {
    name?: string;
    position?: number;
    categoryId?: string | null;
    description?: string;
    icon?: string;
    emoji?: string;
    emojiType?: UpdateChannelRequestDTO.emojiType;
    link?: string;
    /**
     * Cooldown between messages in seconds
     */
    slowMode?: number;
    markdownBlockadeRules?: Array<MarkdownBlockadeRuleDTO>;
};
export namespace UpdateChannelRequestDTO {
    export enum emojiType {
        CUSTOM = 'custom',
        UNICODE = 'unicode',
    }
}
