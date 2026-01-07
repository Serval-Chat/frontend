import { apiClient } from '@/api/client';

import type { User } from './users.types';

export const usersApi = {
    getMe: () => apiClient.get<User>('/api/v1/profile/me').then((r) => r.data),

    getById: (id: string) =>
        apiClient.get<User>(`/api/v1/profile/${id}`).then((r) => r.data),

    updateMe: (data: Partial<User>) =>
        apiClient.patch<User>('/api/v1/profile/me', data).then((r) => r.data),
};
