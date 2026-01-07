import { apiClient } from '@/api/client';

import type { Server } from './servers.types';

export const serversApi = {
    getServers: async (): Promise<Server[]> => {
        const response = await apiClient.get<Server[]>('/api/v1/servers');
        return response.data;
    },
};
