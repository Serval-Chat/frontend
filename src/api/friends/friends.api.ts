import { apiClient } from '@/api/client';

import type { Friend, FriendRequest } from './friends.types';

export const friendsApi = {
    getFriends: async (): Promise<Friend[]> => {
        const response = await apiClient.get<Friend[]>('/api/v1/friends');
        return response.data;
    },

    getIncomingRequests: async (): Promise<FriendRequest[]> => {
        const response = await apiClient.get<FriendRequest[]>(
            '/api/v1/friends/incoming'
        );
        return response.data;
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
