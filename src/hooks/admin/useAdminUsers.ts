import type { UseMutationResult, UseQueryResult } from '@tanstack/react-query';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { apiClient } from '@/api/client';
import { ADMIN_CONSTANTS } from '@/constants/admin';
import type {
    AdminExtendedUser,
    AdminPermissions,
    AdminUser,
} from '@/types/admin';

const createDefaultPermissions = (): AdminPermissions => ({
    adminAccess: false,
    viewUsers: false,
    manageUsers: false,
    manageBadges: false,
    banUsers: false,
    viewBans: false,
    warnUsers: false,
    viewLogs: false,
    manageServer: false,
    manageInvites: false,
});

/**
 * Normalizes user permissions from the API
 */
const normalizePermissions = (permissions: unknown): AdminPermissions => {
    const defaults = createDefaultPermissions();
    if (!permissions || typeof permissions !== 'object') {
        return defaults;
    }

    const p = permissions as Record<string, unknown>;
    const normalized: Partial<AdminPermissions> = {};

    (Object.keys(defaults) as (keyof AdminPermissions)[]).forEach((key) => {
        normalized[key] = p[key] === true;
    });

    return normalized as AdminPermissions;
};

export const useAdminUsers = (
    search: string = '',
    page: number = 0,
    limit: number = ADMIN_CONSTANTS.DEFAULT_PAGE_SIZE,
): UseQueryResult<AdminUser[], Error> =>
    useQuery<AdminUser[]>({
        queryKey: ['admin-users', search, page, limit],
        queryFn: async () => {
            const { data } = await apiClient.get<AdminUser[]>(
                '/api/v1/admin/users',
                {
                    params: {
                        search,
                        limit,
                        offset: page * limit,
                    },
                },
            );

            return data.map((user) => ({
                ...user,
                permissions: normalizePermissions(user.permissions),
            }));
        },
    });

export const useAdminUserDetail = (
    userId: string | null,
): UseQueryResult<AdminExtendedUser, Error> =>
    useQuery<AdminExtendedUser>({
        queryKey: ['admin-user-detail', userId],
        queryFn: async () => {
            if (!userId) throw new Error('User ID is required');
            const { data } = await apiClient.get<AdminExtendedUser>(
                `/api/v1/admin/users/${userId}/details`,
            );

            return {
                ...data,
                permissions: normalizePermissions(data.permissions),
            };
        },
        enabled: !!userId,
    });

export const useUpdateUserPermissions = (): UseMutationResult<
    { message: string },
    Error,
    { userId: string; permissions: AdminPermissions },
    unknown
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: async ({
            userId,
            permissions,
        }: {
            userId: string;
            permissions: AdminPermissions;
        }) => {
            const { data } = await apiClient.put<{ message: string }>(
                `/api/v1/admin/users/${userId}/permissions`,
                {
                    permissions,
                },
            );
            return data;
        },
        onSuccess: () => {
            void queryClient.invalidateQueries({ queryKey: ['admin-users'] });
            void queryClient.invalidateQueries({ queryKey: ['admin-list'] });
            void queryClient.invalidateQueries({
                queryKey: ['admin-user-detail'],
            });
        },
    });
};
