/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { UserWarningIssuedByDTO } from './UserWarningIssuedByDTO';

export type UserWarningResponseDTO = {
    _id: string;
    userId: string;
    message: string;
    issuedBy: UserWarningIssuedByDTO;
    acknowledged: boolean;
    acknowledgedAt?: string;
    timestamp: string;
};
