import { apiClient } from '@/api/client';

import type {
    ServerMemberAdminFilters,
    ServerMemberAdminListResponse,
} from './serverMembersAdmin.types';

interface GetServerMembersAdminParams extends ServerMemberAdminFilters {
    limit?: number;
    offset?: number;
}

export const serverMembersAdminApi = {
    /**
     * Fetch a filtered/paginated member list for the admin Members tab
     */
    getServerMembersAdmin: async (
        serverId: string,
        params?: GetServerMembersAdminParams,
    ): Promise<ServerMemberAdminListResponse> => {
        const cleanParams = Object.fromEntries(
            Object.entries(params ?? {}).filter(([, v]): boolean => v !== ''),
        );

        const response = await apiClient.get<ServerMemberAdminListResponse>(
            `/api/v1/servers/${serverId}/members/admin`,
            { params: cleanParams },
        );
        return response.data;
    },
};
