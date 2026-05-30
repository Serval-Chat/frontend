/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
import type { AuditLogChangesDTO } from './AuditLogChangesDTO';
import type { AuditLogMetadataDTO } from './AuditLogMetadataDTO';
import type { AuditLogModeratorDTO } from './AuditLogModeratorDTO';
import type { AuditLogTargetDTO } from './AuditLogTargetDTO';

export type ServerAuditLogEntryDTO = {
    id: string;
    action: string;
    moderatorId: string;
    moderator: AuditLogModeratorDTO;
    targetId?: string;
    targetType?: string;
    target?: AuditLogTargetDTO;
    changes?: AuditLogChangesDTO;
    reason?: string;
    metadata?: AuditLogMetadataDTO;
    createdAt: string;
};
