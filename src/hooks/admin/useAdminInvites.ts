import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminInvitesApi } from '@/api/admin/invites.api';

export const useAdminInvites = (): UseQueryResult<string[], Error> =>
    useQuery<string[]>({
        queryKey: ['admin-invites'],
        queryFn: () => adminInvitesApi.getInvites(),
    });

export const useCreateAdminInvite = (): UseMutationResult<
    { message: string; token: string },
    Error,
    void,
    unknown
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: () => adminInvitesApi.createInvite(),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin-invites'] });
        },
    });
};

export const useDeleteAdminInvite = (): UseMutationResult<
    { message: string },
    Error,
    { token: string },
    unknown
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ token }) => adminInvitesApi.deleteInvite(token),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin-invites'] });
        },
    });
};
export const useCreateBatchAdminInvites = (): UseMutationResult<
    { message: string; tokens: string[] },
    Error,
    { count: number },
    unknown
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ count }) => adminInvitesApi.createBatchInvites(count),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin-invites'] });
        },
    });
};
