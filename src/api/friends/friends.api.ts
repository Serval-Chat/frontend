import { apiClient } from '@/api/client';

import type { Friend } from './friends.types';

export const friendsApi = {
    getFriends: async (): Promise<Friend[]> => {
        const response = await apiClient.get<Friend[]>('/api/v1/friends');
        return response.data;
    },
};
