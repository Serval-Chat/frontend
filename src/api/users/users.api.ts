import { apiClient } from '@/api/client';

import type {
    CreateWebsiteConnectionResponse,
    User,
    UserSettings,
    UsernameFont,
    UsernameGlow,
    UsernameGradient,
} from './users.types';

export const usersApi = {
    getMe: (): Promise<User> =>
        apiClient.get<User>('/api/v1/profile/me').then((r): User => r.data),

    getById: (id: string): Promise<User> =>
        apiClient.get<User>(`/api/v1/profile/${id}`).then((r): User => r.data),

    getBulk: (ids: string[]): Promise<User[]> =>
        apiClient
            .post<User[]>('/api/v1/profile/bulk', { ids })
            .then((r): User[] => r.data),

    updateBio: (bio: string): Promise<{ message: string; bio: string }> =>
        apiClient
            .patch<{
                message: string;
                bio: string;
            }>('/api/v1/profile/bio', { bio })
            .then((r): { message: string; bio: string } => r.data),

    updatePronouns: (
        pronouns: string,
    ): Promise<{ message: string; pronouns: string }> =>
        apiClient
            .patch<{
                message: string;
                pronouns: string;
            }>('/api/v1/profile/pronouns', { pronouns })
            .then((r): { message: string; pronouns: string } => r.data),

    updateDisplayName: (
        displayName: string,
    ): Promise<{ message: string; displayName: string | null }> =>
        apiClient
            .patch<{
                message: string;
                displayName: string | null;
            }>('/api/v1/profile/display-name', { displayName })
            .then(
                (r): { message: string; displayName: string | null } => r.data,
            ),

    updateUsername: (
        newUsername: string,
    ): Promise<{ message: string; username: string }> =>
        apiClient
            .patch<{
                message: string;
                username: string;
            }>('/api/v1/profile/username', { newUsername })
            .then((r): { message: string; username: string } => r.data),

    updateStyle: (data: {
        usernameFont?: UsernameFont;
        usernameGradient?: UsernameGradient;
        usernameGlow?: UsernameGlow;
    }) =>
        apiClient
            .patch<{
                message: string;
                usernameFont?: UsernameFont;
                usernameGradient?: UsernameGradient;
                usernameGlow?: UsernameGlow;
            }>('/api/v1/profile/style', data)
            .then((r) => r.data),

    updateSettings: (
        data: Partial<UserSettings>,
    ): Promise<{ message: string; settings: UserSettings }> =>
        apiClient
            .post<{
                message: string;
                settings: UserSettings;
            }>('/api/v1/settings', data)
            .then((r): { message: string; settings: UserSettings } => r.data),

    updateLanguage: (
        language: string,
    ): Promise<{ message: string; language: string }> =>
        apiClient
            .patch<{
                message: string;
                language: string;
            }>('/api/v1/profile/language', { language })
            .then((r): { message: string; language: string } => r.data),

    updateStatus: (data: {
        text?: string;
        emoji?: string;
        expiresAt?: string | null;
        expiresInMinutes?: number;
        clear?: boolean;
    }): Promise<{ customStatus: User['customStatus'] }> =>
        apiClient
            .patch<{
                customStatus: User['customStatus'];
            }>('/api/v1/profile/status', data)
            .then((r): { customStatus: User['customStatus'] } => r.data),

    updateProfilePicture: (
        file: File,
    ): Promise<{ message: string; profilePicture: string }> => {
        const formData = new FormData();
        formData.append('profilePicture', file);
        return apiClient
            .post<{
                message: string;
                profilePicture: string;
            }>('/api/v1/profile/picture', formData)
            .then((r): { message: string; profilePicture: string } => r.data);
    },

    updateBanner: (
        file: File,
    ): Promise<{ message: string; banner: string }> => {
        const formData = new FormData();
        formData.append('banner', file);
        return apiClient
            .post<{
                message: string;
                banner: string;
            }>('/api/v1/profile/banner', formData)
            .then((r): { message: string; banner: string } => r.data);
    },

    createWebsiteConnection: (
        website: string,
    ): Promise<CreateWebsiteConnectionResponse> =>
        apiClient
            .post<CreateWebsiteConnectionResponse>(
                '/api/v1/profile/connections/website',
                { website },
            )
            .then((r): CreateWebsiteConnectionResponse => r.data),

    verifyConnection: (connectionId: string) =>
        apiClient
            .post<{
                message: string;
                connection: { id: string; type: 'Website'; value: string };
            }>(`/api/v1/profile/connections/${connectionId}/verify`)
            .then((r) => r.data),

    removeConnection: (connectionId: string): Promise<{ message: string }> =>
        apiClient
            .delete<{
                message: string;
            }>(`/api/v1/profile/connections/${connectionId}`)
            .then((r): { message: string } => r.data),
};
