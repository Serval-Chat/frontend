import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/api/client';
import { ADMIN_CONSTANTS } from '@/constants/admin';
import type { AdminStats } from '@/types/admin';

export const useAdminStats = (): UseQueryResult<AdminStats, Error> =>
    useQuery<AdminStats>({
        queryKey: ['admin-stats'],
        queryFn: async () => {
            const { data } = await apiClient.get<AdminStats>(
                '/api/v1/admin/stats',
            );
            return data;
        },
        refetchInterval: ADMIN_CONSTANTS.STATS_REFETCH_INTERVAL,
    });
