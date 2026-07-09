import {
    type InfiniteData,
    type UseInfiniteQueryResult,
    useInfiniteQuery,
} from '@tanstack/react-query';

import { auditLogApi } from './auditLog.api';
import type { AuditLogFilters, AuditLogResponse } from './auditLog.types';

const AUDIT_LOG_QUERY_KEYS = {
    serverAuditLog: (
        serverId: string | null,
        filters: AuditLogFilters,
    ): readonly ['server', 'auditLog', string | null, AuditLogFilters] =>
        ['server', 'auditLog', serverId, filters] as const,
};

export const useServerAuditLog = (
    serverId: string | null,
    filters: AuditLogFilters,
): UseInfiniteQueryResult<InfiniteData<AuditLogResponse>> =>
    useInfiniteQuery({
        queryKey: AUDIT_LOG_QUERY_KEYS.serverAuditLog(serverId, filters),
        queryFn: ({ pageParam }): Promise<AuditLogResponse> => {
            if (serverId === null) {
                throw new Error('serverId is required');
            }
            return auditLogApi.getServerAuditLog(serverId, {
                ...filters,
                cursor: pageParam,
            });
        },
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage): string | undefined =>
            lastPage.nextCursor ?? undefined,
        enabled: Boolean(serverId),
    });
