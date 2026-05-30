/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { AdminBanHistoryItemDTO } from './AdminBanHistoryItemDTO';

export type AdminBanUserResponseDTO = {
    _id: string;
    userId: string;
    reason: string;
    issuedBy: string;
    expirationTimestamp: string;
    active: boolean;
    history?: Array<AdminBanHistoryItemDTO>;
};
