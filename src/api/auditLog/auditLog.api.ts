import { apiClient } from '@/api/client';

import type { AuditLogFilters, AuditLogResponse } from './auditLog.types';

interface GetAuditLogParams extends AuditLogFilters {
    cursor?: string;
    limit?: number;
}

export const auditLogApi = {
    /**
     * Fetch the audit log for a given server
     *
     * @param serverId - The server ID
     * @param params - Filters and pagination params
     */
    getServerAuditLog: async (
        serverId: string,
        params?: GetAuditLogParams,
    ): Promise<AuditLogResponse> => {
        const rawParams = {
            limit: params?.limit,
            cursor: params?.cursor,
            action: params?.actionType,
            moderatorId: params?.moderatorId,
            targetId: params?.targetId,
            reason: params?.reason,
        };

        const cleanParams = Object.fromEntries(
            Object.entries(rawParams).filter(
                ([_, v]) => v !== undefined && v !== null && v !== '',
            ),
        );

        const response = await apiClient.get<AuditLogResponse>(
            `/api/v1/servers/${serverId}/audit-log`,
            {
                params: cleanParams,
            },
        );
        return response.data;
    },
};
