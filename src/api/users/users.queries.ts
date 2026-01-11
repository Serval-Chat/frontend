import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

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

export const useUpdateMe = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: usersApi.updateMe,
        onSuccess: (data) => {
            queryClient.setQueryData(['me'], data);
        },
    });
};

export const useUpdateStatus = () => {
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
