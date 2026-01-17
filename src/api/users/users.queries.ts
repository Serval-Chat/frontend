import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { usersApi } from './users.api';
import type { User } from './users.types';

export const useMe = (): UseQueryResult<User, Error> =>
    useQuery({
        queryKey: ['me'],
        queryFn: usersApi.getMe,
    });

export const useUserById = (
    id: string,
    options: { enabled?: boolean } = {}
): UseQueryResult<User, Error> =>
    useQuery({
        queryKey: ['user', id],
        queryFn: () => usersApi.getById(id),
        enabled: (options.enabled ?? true) && !!id,
    });

export const useUpdateMe = (): UseMutationResult<
    User,
    Error,
    Partial<User>
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: usersApi.updateMe,
        onSuccess: (data) => {
            queryClient.setQueryData(['me'], data);
        },
    });
};

export const useUpdateStatus = (): UseMutationResult<
    { customStatus: User['customStatus'] },
    Error,
    {
        text?: string;
        emoji?: string;
        expiresAt?: string | null;
        expiresInMinutes?: number;
        clear?: boolean;
    }
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: usersApi.updateStatus,
        onSuccess: (data) => {
            queryClient.setQueryData(['me'], (old: unknown) => {
                if (!old) return old;
                return { ...(old as object), customStatus: data.customStatus };
            });
        },
    });
};
