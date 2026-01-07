import { useQuery } from '@tanstack/react-query';

import { usersApi } from './users.api';

export const useMe = () => {
    return useQuery({
        queryKey: ['me'],
        queryFn: usersApi.getMe,
    });
};

export const useUserById = (
    id: string,
    options: { enabled?: boolean } = {}
) => {
    return useQuery({
        queryKey: ['user', id],
        queryFn: () => usersApi.getById(id),
        enabled: (options.enabled ?? true) && !!id,
    });
};
