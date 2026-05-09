import { useQuery } from '@tanstack/react-query';

import { usersApi } from '@/api/users/users.api';

export const USERS_QUERY_KEYS = {
    all: ['users'] as const,
    bulk: (ids: string[]) => [...USERS_QUERY_KEYS.all, 'bulk', ids] as const,
};

export const useUsers = (ids: string[]) =>
    useQuery({
        queryKey: USERS_QUERY_KEYS.bulk(ids),
        queryFn: () => usersApi.getBulk(ids),
        enabled: ids.length > 0,
        staleTime: 1000 * 60 * 5,
    });
