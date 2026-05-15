import { apiClient } from '@/api/client';
import type { User } from '@/api/users/users.types';

import type { Friend, FriendRequest } from './friends.types';

const unwrapArray = <T>(data: unknown, keys: string[]): T[] => {
    if (Array.isArray(data)) return data as T[];
    if (data && typeof data === 'object') {
        for (const key of keys) {
            const value = (data as Record<string, unknown>)[key];
            if (Array.isArray(value)) return value as T[];
        }
    }
    return [];
};

export const friendsApi = {
    getFriends: async (): Promise<Friend[]> => {
        const response = await apiClient.get<unknown>('/api/v1/friends');
        return unwrapArray<Friend>(response.data, ['friends', 'data']);
    },

    getFriendProfiles: async (): Promise<User[]> => {
        const response = await apiClient.get<unknown>(
            '/api/v1/friends/profiles',
        );
        return unwrapArray<User>(response.data, [
            'friends',
            'profiles',
            'data',
        ]);
    },

    getIncomingRequests: async (): Promise<FriendRequest[]> => {
        const response = await apiClient.get<unknown>(
            '/api/v1/friends/incoming',
        );
        return unwrapArray<FriendRequest>(response.data, [
            'requests',
            'incoming',
            'data',
        ]);
    },

    sendFriendRequest: async (username: string): Promise<void> => {
        await apiClient.post('/api/v1/friends', { username });
    },

    acceptFriendRequest: async (requestId: string): Promise<void> => {
        await apiClient.post(`/api/v1/friends/${requestId}/accept`);
    },

    rejectFriendRequest: async (requestId: string): Promise<void> => {
        await apiClient.post(`/api/v1/friends/${requestId}/reject`);
    },

    removeFriend: async (friendId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/friends/${friendId}`);
    },
};
