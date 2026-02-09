import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/api/client';

export interface AdminUserShort {
    _id: string;
    username: string;
    displayName?: string;
}

export const useAdminList = (): UseQueryResult<AdminUserShort[], Error> =>
    useQuery<AdminUserShort[]>({
        queryKey: ['admin-list'],
        queryFn: async () => {
            const { data } = await apiClient.get<AdminUserShort[]>(
                '/api/v1/admin/users/admins',
            );
            return data;
        },
    });
