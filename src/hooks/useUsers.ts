import { useQuery } from '@tanstack/react-query';
import type { UseQueryResult } from '@tanstack/react-query';

import { usersApi } from '@/api/users/users.api';
import type { User } from '@/api/users/users.types';

export const USERS_QUERY_KEYS = {
    all: ['users'] as const,
    bulk: (ids: string[]) => [...USERS_QUERY_KEYS.all, 'bulk', ids] as const,
};

export const useUsers = (ids: string[]): UseQueryResult<User[]> =>
    useQuery({
        queryKey: USERS_QUERY_KEYS.bulk(ids),
        queryFn: () => usersApi.getBulk(ids),
        enabled: ids.length > 0,
        staleTime: 1000 * 60 * 5,
    });
