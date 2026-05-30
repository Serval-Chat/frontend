/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { ServerAuditLogEntryDTO } from './ServerAuditLogEntryDTO';

export type ServerAuditLogResponseDTO = {
    entries: Array<ServerAuditLogEntryDTO>;
    nextCursor?: string | null;
};
