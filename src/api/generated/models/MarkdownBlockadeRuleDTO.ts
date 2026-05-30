/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type MarkdownBlockadeRuleDTO = {
    targetType: MarkdownBlockadeRuleDTO.targetType;
    targetId: string;
    features: Array<string>;
};
export namespace MarkdownBlockadeRuleDTO {
    export enum targetType {
        EVERYONE = 'everyone',
        ROLE = 'role',
        USER = 'user',
    }
}
