import { apiClient } from '@/api/client';

import type {
    Category,
    Channel,
    Role,
    Server,
    ServerMember,
} from './servers.types';

export const serversApi = {
    getServers: async (): Promise<Server[]> => {
        const response = await apiClient.get<Server[]>('/api/v1/servers');
        return response.data;
    },

    getServerDetails: async (serverId: string): Promise<Server> => {
        const response = await apiClient.get<Server>(
            `/api/v1/servers/${serverId}`
        );
        return response.data;
    },

    getChannels: async (serverId: string): Promise<Channel[]> => {
        const response = await apiClient.get<Channel[]>(
            `/api/v1/servers/${serverId}/channels`
        );
        return response.data;
    },

    getCategories: async (serverId: string): Promise<Category[]> => {
        const response = await apiClient.get<Category[]>(
            `/api/v1/servers/${serverId}/categories`
        );
        return response.data;
    },

    getRoles: async (serverId: string): Promise<Role[]> => {
        const response = await apiClient.get<Role[]>(
            `/api/v1/servers/${serverId}/roles`
        );
        return response.data;
    },

    getMembers: async (serverId: string): Promise<ServerMember[]> => {
        const response = await apiClient.get<ServerMember[]>(
            `/api/v1/servers/${serverId}/members`
        );
        return response.data;
    },
};
