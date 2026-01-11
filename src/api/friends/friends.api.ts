import { apiClient } from '@/api/client';

import type { Friend } from './friends.types';

export const friendsApi = {
    getFriends: async (): Promise<Friend[]> => {
        const response = await apiClient.get<Friend[]>('/api/v1/friends');
        return response.data;
    },

    sendFriendRequest: async (username: string): Promise<void> => {
        await apiClient.post('/api/v1/friends', { username });
    },

    removeFriend: async (friendId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/friends/${friendId}`);
    },
};
