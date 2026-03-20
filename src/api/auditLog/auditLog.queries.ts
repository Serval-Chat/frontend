import {
    type InfiniteData,
    type UseInfiniteQueryResult,
    useInfiniteQuery,
} from '@tanstack/react-query';

import { auditLogApi } from './auditLog.api';
import type { AuditLogFilters, AuditLogResponse } from './auditLog.types';

export const AUDIT_LOG_QUERY_KEYS = {
    serverAuditLog: (serverId: string | null, filters: AuditLogFilters) =>
        ['server', 'auditLog', serverId, filters] as const,
};

export const useServerAuditLog = (
    serverId: string | null,
    filters: AuditLogFilters,
): UseInfiniteQueryResult<InfiniteData<AuditLogResponse>, Error> =>
    useInfiniteQuery({
        queryKey: AUDIT_LOG_QUERY_KEYS.serverAuditLog(serverId, filters),
        queryFn: ({ pageParam }) =>
            auditLogApi.getServerAuditLog(serverId!, {
                ...filters,
                cursor: pageParam,
            }),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        enabled: Boolean(serverId),
    });
