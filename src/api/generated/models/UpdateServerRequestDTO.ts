/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { MarkdownBlockadeRuleDTO } from './MarkdownBlockadeRuleDTO';
import type { ServerBannerDTO } from './ServerBannerDTO';

export type UpdateServerRequestDTO = {
    name?: string;
    description?: string;
    banner?: ServerBannerDTO;
    disableCustomFonts?: boolean;
    disableUsernameGlowAndCustomColor?: boolean;
    markdownBlockadeRules?: Array<MarkdownBlockadeRuleDTO>;
    discoveryEnabled?: boolean;
    defaultRoleId?: string | null;
    tags?: Array<string>;
};
