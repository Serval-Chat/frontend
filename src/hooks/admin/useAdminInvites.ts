import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminInvitesApi } from '@/api/admin/invites.api';

export const useAdminInvites = (): UseQueryResult<string[]> =>
    useQuery<string[]>({
        queryKey: ['admin-invites'],
        queryFn: (): Promise<string[]> => adminInvitesApi.getInvites(),
    });

export const useCreateAdminInvite = (): UseMutationResult<
    { message: string; token: string },
    Error,
    void
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (): Promise<{ message: string; token: string }> =>
            adminInvitesApi.createInvite(),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-invites'] });
        },
    });
};

export const useCreateBatchAdminInvites = (): UseMutationResult<
    { message: string; tokens: string[] },
    Error,
    { count: number }
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            count,
        }): Promise<{ message: string; tokens: string[] }> =>
            adminInvitesApi.createBatchInvites(count),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-invites'] });
        },
    });
};
