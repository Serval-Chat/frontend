/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { ServerAuditLogResponseDTO } from '../models/ServerAuditLogResponseDTO';

export class ServerAuditLogService {
    /**
     * Get server audit log
     * @param serverId
     * @param limit
     * @param cursor
     * @param action
     * @param moderatorId
     * @param targetId
     * @param after
     * @param before
     * @param reason
     * @returns ServerAuditLogResponseDTO Audit log entries
     * @throws ApiError
     */
    public static serverAuditLogControllerGetAuditLog(
        serverId: string,
        limit?: number,
        cursor?: string,
        action?: string,
        moderatorId?: string,
        targetId?: string,
        after?: string,
        before?: string,
        reason?: string,
    ): CancelablePromise<ServerAuditLogResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/audit-log',
            path: {
                serverId: serverId,
            },
            query: {
                limit: limit,
                cursor: cursor,
                action: action,
                moderatorId: moderatorId,
                targetId: targetId,
                after: after,
                before: before,
                reason: reason,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
}
