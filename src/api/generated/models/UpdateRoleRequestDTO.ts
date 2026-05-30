/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type UpdateRoleRequestDTO = {
    name?: string;
    color?: string;
    /**
     * Use colors array instead
     * @deprecated
     */
    startColor?: string;
    /**
     * Use colors array instead
     * @deprecated
     */
    endColor?: string;
    colors?: Array<string>;
    gradientRepeat?: number;
    separateFromOtherRoles?: boolean;
    permissions?: Record<string, any>;
    position?: number;
    glowEnabled?: boolean;
    /**
     * Short description shown during onboarding role selection
     */
    description?: string;
};
