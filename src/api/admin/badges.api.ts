import { apiClient } from '@/api/client';
import type { Badge } from '@/api/users/users.types';

export const adminBadgesApi = {
    getBadges: () =>
        apiClient.get<Badge[]>('/api/v1/admin/badges').then((r) => r.data),

    createBadge: (
        payload: Pick<Badge, 'id' | 'name' | 'description' | 'icon' | 'color'>,
    ) =>
        apiClient
            .post<Badge>('/api/v1/admin/badges', payload)
            .then((r) => r.data),

    updateBadge: (
        badgeId: string,
        patch: Partial<Pick<Badge, 'name' | 'description' | 'icon' | 'color'>>,
    ) =>
        apiClient
            .put<Badge>(`/api/v1/admin/badges/${badgeId}`, patch)
            .then((r) => r.data),

    deleteBadge: async (badgeId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/admin/badges/${badgeId}`);
    },

    assignBadgeToUser: (
        userId: string,
        badgeId: string,
    ): Promise<{ message: string }> =>
        apiClient
            .post<{ message: string }>(`/api/v1/admin/users/${userId}/badges`, {
                badgeId,
            })
            .then((r): { message: string } => r.data),

    removeBadgeFromUser: async (
        userId: string,
        badgeId: string,
    ): Promise<void> => {
        await apiClient.delete(
            `/api/v1/admin/users/${userId}/badges/${badgeId}`,
        );
    },
};
