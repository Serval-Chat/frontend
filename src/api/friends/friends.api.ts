import { apiClient } from '@/api/client';
import type { User } from '@/api/users/users.types';

import type {
    AcceptFriendRequestResponse,
    Friend,
    FriendRequest,
    SendFriendRequestResponse,
} from './friends.types';

export const friendsApi = {
    getFriends: async (): Promise<Friend[]> => {
        const response = await apiClient.get<Friend[]>('/api/v1/friends');
        return response.data;
    },

    getFriendProfiles: async (): Promise<User[]> => {
        const response = await apiClient.get<User[]>(
            '/api/v1/friends/profiles',
        );
        return response.data;
    },

    getIncomingRequests: async (): Promise<FriendRequest[]> => {
        const response = await apiClient.get<FriendRequest[]>(
            '/api/v1/friends/incoming',
        );
        return response.data;
    },

    getOutgoingRequests: async (): Promise<FriendRequest[]> => {
        const response = await apiClient.get<FriendRequest[]>(
            '/api/v1/friends/outgoing',
        );
        return response.data;
    },

    sendFriendRequest: async (
        username: string,
    ): Promise<SendFriendRequestResponse> => {
        const response = await apiClient.post<SendFriendRequestResponse>(
            '/api/v1/friends',
            { username },
        );
        return response.data;
    },

    acceptFriendRequest: async (
        requestId: string,
    ): Promise<AcceptFriendRequestResponse> => {
        const response = await apiClient.post<AcceptFriendRequestResponse>(
            `/api/v1/friends/${requestId}/accept`,
        );
        return response.data;
    },

    rejectFriendRequest: async (requestId: string): Promise<void> => {
        await apiClient.post(`/api/v1/friends/${requestId}/reject`);
    },

    cancelFriendRequest: async (requestId: string): Promise<void> => {
        await apiClient.post(`/api/v1/friends/${requestId}/cancel`);
    },

    removeFriend: async (friendId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/friends/${friendId}`);
    },

    togglePinFriend: async (
        friendId: string,
    ): Promise<{ friendId: string; isPinned: boolean }> => {
        const response = await apiClient.post<{
            friendId: string;
            isPinned: boolean;
        }>(`/api/v1/friends/${friendId}/pin`);
        return response.data;
    },
};
