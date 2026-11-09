import type { UseMutationResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { adminBadgesApi } from '@/api/admin/badges.api';
import type { Badge } from '@/api/users/users.types';

export const useAdminBadges = () =>
    useQuery<Badge[]>({
        queryKey: ['admin-badges'],
        queryFn: () => adminBadgesApi.getBadges(),
    });

export const useCreateAdminBadge = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: (
            payload: Pick<
                Badge,
                'id' | 'name' | 'description' | 'icon' | 'color'
            >,
        ) => adminBadgesApi.createBadge(payload),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
        },
    });
};

export const useUpdateAdminBadge = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({
            badgeId,
            patch,
        }: {
            badgeId: string;
            patch: Partial<
                Pick<Badge, 'name' | 'description' | 'icon' | 'color'>
            >;
        }) => adminBadgesApi.updateBadge(badgeId, patch),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
        },
    });
};

export const useDeleteAdminBadge = (): UseMutationResult<
    void,
    Error,
    { badgeId: string }
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ badgeId }): Promise<void> =>
            adminBadgesApi.deleteBadge(badgeId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({ queryKey: ['admin-badges'] });
        },
    });
};

export const useAssignBadgeToUser = (): UseMutationResult<
    { message: string },
    Error,
    { userId: string; badgeId: string }
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, badgeId }): Promise<{ message: string }> =>
            adminBadgesApi.assignBadgeToUser(userId, badgeId),
        onSuccess: (_, { userId }): void => {
            void queryClient.invalidateQueries({
                queryKey: ['admin-user-detail', userId],
            });
            void queryClient.invalidateQueries({
                queryKey: ['admin-users'],
            });
        },
    });
};

export const useRemoveBadgeFromUser = (): UseMutationResult<
    void,
    Error,
    { userId: string; badgeId: string }
> => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: ({ userId, badgeId }): Promise<void> =>
            adminBadgesApi.removeBadgeFromUser(userId, badgeId),
        onSuccess: (_, { userId }): void => {
            void queryClient.invalidateQueries({
                queryKey: ['admin-user-detail', userId],
            });
            void queryClient.invalidateQueries({
                queryKey: ['admin-users'],
            });
        },
    });
};
