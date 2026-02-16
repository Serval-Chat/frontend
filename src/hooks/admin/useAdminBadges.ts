import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminBadgesApi } from '@/api/admin/badges.api';
import type { Badge } from '@/api/users/users.types';

export const useAdminBadges = (): UseQueryResult<Badge[], Error> =>
    useQuery<Badge[]>({
        queryKey: ['admin-badges'],
        queryFn: () => adminBadgesApi.getBadges(),
    });

export const useCreateAdminBadge = (): UseMutationResult<
    Badge,
    Error,
    Pick<Badge, 'id' | 'name' | 'description' | 'icon' | 'color'>,
    unknown
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (payload) => adminBadgesApi.createBadge(payload),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
        },
    });
};

export const useUpdateAdminBadge = (): UseMutationResult<
    Badge,
    Error,
    {
        badgeId: string;
        patch: Partial<Pick<Badge, 'name' | 'description' | 'icon' | 'color'>>;
    },
    unknown
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ badgeId, patch }) =>
            adminBadgesApi.updateBadge(badgeId, patch),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
        },
    });
};

export const useDeleteAdminBadge = (): UseMutationResult<
    { message: string },
    Error,
    { badgeId: string },
    unknown
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ badgeId }) => adminBadgesApi.deleteBadge(badgeId),
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
        },
    });
};
