import { apiClient } from '@/api/client';

import type { User } from './users.types';

export const usersApi = {
    getMe: () => apiClient.get<User>('/api/v1/profile/me').then((r) => r.data),

    getById: (id: string) =>
        apiClient.get<User>(`/api/v1/profile/${id}`).then((r) => r.data),

    updateBio: (bio: string) =>
        apiClient
            .patch<{
                message: string;
                bio: string;
            }>('/api/v1/profile/bio', { bio })
            .then((r) => r.data),

    updatePronouns: (pronouns: string) =>
        apiClient
            .patch<{
                message: string;
                pronouns: string;
            }>('/api/v1/profile/pronouns', { pronouns })
            .then((r) => r.data),

    updateDisplayName: (displayName: string) =>
        apiClient
            .patch<{
                message: string;
                displayName: string | null;
            }>('/api/v1/profile/display-name', { displayName })
            .then((r) => r.data),

    updateUsername: (newUsername: string) =>
        apiClient
            .patch<{
                message: string;
                username: string;
            }>('/api/v1/profile/username', { newUsername })
            .then((r) => r.data),

    updateStyle: (data: {
        usernameFont?: string;
        usernameGradient?: {
            enabled: boolean;
            colors: string[];
            angle: number;
        };
        usernameGlow?: {
            enabled: boolean;
            color?: string;
            intensity: number;
        };
    }) =>
        apiClient
            .patch<{
                message: string;
                usernameFont?: string;
                usernameGradient?: {
                    enabled: boolean;
                    colors: string[];
                    angle: number;
                };
                usernameGlow?: {
                    enabled: boolean;
                    color: string;
                    intensity: number;
                };
            }>('/api/v1/profile/style', data)
            .then((r) => r.data),

    updateLanguage: (language: string) =>
        apiClient
            .patch<{
                message: string;
                language: string;
            }>('/api/v1/profile/language', { language })
            .then((r) => r.data),

    updateStatus: (data: {
        text?: string;
        emoji?: string;
        expiresAt?: string | null;
        expiresInMinutes?: number;
        clear?: boolean;
    }) =>
        apiClient
            .patch<{
                customStatus: User['customStatus'];
            }>('/api/v1/profile/status', data)
            .then((r) => r.data),
};
