import {
    keepPreviousData,
    useQuery,
    type UseQueryResult,
} from '@tanstack/react-query';

import { serverMembersAdminApi } from './serverMembersAdmin.api';
import type {
    ServerMemberAdminFilters,
    ServerMemberAdminListResponse,
} from './serverMembersAdmin.types';

interface ServerMembersAdminPagination {
    limit: number;
    offset: number;
}

const SERVER_MEMBERS_ADMIN_QUERY_KEYS = {
    list: (
        serverId: string | null,
        filters: ServerMemberAdminFilters,
        pagination: ServerMembersAdminPagination,
    ) => ['server', 'membersAdmin', serverId, filters, pagination] as const,
};

export const useServerMembersAdmin = (
    serverId: string | null,
    filters: ServerMemberAdminFilters,
    pagination: ServerMembersAdminPagination,
): UseQueryResult<ServerMemberAdminListResponse> =>
    useQuery({
        queryKey: SERVER_MEMBERS_ADMIN_QUERY_KEYS.list(
            serverId,
            filters,
            pagination,
        ),
        queryFn: (): Promise<ServerMemberAdminListResponse> =>
            serverMembersAdminApi.getServerMembersAdmin(serverId!, {
                ...filters,
                ...pagination,
            }),
        enabled: Boolean(serverId),
        placeholderData: keepPreviousData,
    });
