import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminInvitesApi } from '@/api/admin/invites.api';

const ADMIN_INVITES_KEYS = ['admin-invites'] as const;

export const useAdminInvites = (): UseQueryResult<string[], Error> =>
    useQuery<string[]>({
        queryKey: ADMIN_INVITES_KEYS,
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
            void queryClient.invalidateQueries({
                queryKey: ADMIN_INVITES_KEYS,
            });
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
        mutationFn: (data: { count: number }) =>
            adminInvitesApi.createBatchInvites(data.count),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: ADMIN_INVITES_KEYS,
            });
        },
    });
};
