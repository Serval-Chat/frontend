import type { UseQueryResult } from '@tanstack/react-query';
import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/api/client';
import { ADMIN_CONSTANTS } from '@/constants/admin';
import type { AdminStats } from '@/types/admin';

export type StatsRange = '24h' | '7d' | '30d' | 'all';

export const useAdminStats = (
    range: StatsRange = '24h',
): UseQueryResult<AdminStats, Error> =>
    useQuery<AdminStats>({
        queryKey: ['admin-stats', range],
        queryFn: async () => {
            const { data } = await apiClient.get<AdminStats>(
                `/api/v1/admin/stats?range=${range}`,
            );
            return data;
        },
        refetchInterval: ADMIN_CONSTANTS.STATS_REFETCH_INTERVAL,
    });
