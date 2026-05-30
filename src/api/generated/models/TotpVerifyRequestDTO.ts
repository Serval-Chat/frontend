/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */

export type TotpVerifyRequestDTO = {
    tempToken: string;
    /**
     * 6 digit authenticator code
     */
    code?: string;
    /**
     * Backup code in XXXX-XXXX format
     */
    backupCode?: string;
};
