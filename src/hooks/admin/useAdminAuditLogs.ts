import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/api/client';
import { ADMIN_CONSTANTS } from '@/constants/admin';
import type { AuditLog } from '@/types/admin';

export interface AuditLogFilters {
    limit?: number;
    offset?: number;
    adminId?: string;
    actionType?: string;
    targetUserId?: string;
    startDate?: string;
    endDate?: string;
}

export const useAdminAuditLogs = (
    filters: AuditLogFilters = {
        limit: ADMIN_CONSTANTS.MAX_AUDIT_LOGS_PAGE_SIZE,
        offset: 0,
    },
): UseQueryResult<AuditLog[], Error> =>
    useQuery<AuditLog[]>({
        queryKey: ['admin-audit-logs', filters],
        queryFn: async () => {
            const { data } = await apiClient.get<AuditLog[]>(
                '/api/v1/admin/logs',
                {
                    params: filters,
                },
            );
            return data;
        },
    });
