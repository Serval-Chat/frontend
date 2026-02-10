import { apiClient } from '@/api/client';
import type { Emoji } from '@/api/emojis/emojis.types';

import type {
    Category,
    Channel,
    Role,
    RolePermissions,
    Server,
    ServerMember,
} from './servers.types';

export const serversApi = {
    getServers: async (): Promise<Server[]> => {
        const response = await apiClient.get<Server[]>('/api/v1/servers');
        return response.data;
    },

    createServer: async (
        name: string,
        icon?: File,
    ): Promise<{ server: Server; channel: Channel }> => {
        const response = await apiClient.post<{
            server: Server;
            channel: Channel;
        }>('/api/v1/servers', { name });

        if (icon) {
            await serversApi.uploadServerIcon(response.data.server._id, icon);
        }

        return response.data;
    },

    joinServer: async (inviteCode: string): Promise<{ serverId: string }> => {
        const response = await apiClient.post<{ serverId: string }>(
            `/api/v1/invites/${inviteCode}/join`,
        );
        return response.data;
    },

    getServerDetails: async (serverId: string): Promise<Server> => {
        const response = await apiClient.get<Server>(
            `/api/v1/servers/${serverId}`,
        );
        return response.data;
    },

    getChannels: async (serverId: string): Promise<Channel[]> => {
        const response = await apiClient.get<Channel[]>(
            `/api/v1/servers/${serverId}/channels`,
        );
        return response.data;
    },

    getCategories: async (serverId: string): Promise<Category[]> => {
        const response = await apiClient.get<Category[]>(
            `/api/v1/servers/${serverId}/categories`,
        );
        return response.data;
    },

    getRoles: async (serverId: string): Promise<Role[]> => {
        const response = await apiClient.get<Role[]>(
            `/api/v1/servers/${serverId}/roles`,
        );
        return response.data;
    },

    addRoleToMember: async (
        serverId: string,
        userId: string,
        roleId: string,
    ): Promise<void> => {
        await apiClient.post(
            `/api/v1/servers/${serverId}/members/${userId}/roles/${roleId}`,
        );
    },

    removeRoleFromMember: async (
        serverId: string,
        userId: string,
        roleId: string,
    ): Promise<void> => {
        await apiClient.delete(
            `/api/v1/servers/${serverId}/members/${userId}/roles/${roleId}`,
        );
    },

    getMembers: async (serverId: string): Promise<ServerMember[]> => {
        const response = await apiClient.get<ServerMember[]>(
            `/api/v1/servers/${serverId}/members`,
        );
        return response.data;
    },

    getEmojis: async (serverId: string): Promise<Emoji[]> => {
        const response = await apiClient.get<Emoji[]>(
            `/api/v1/servers/${serverId}/emojis`,
        );
        return response.data;
    },

    reorderChannels: async (
        serverId: string,
        channelPositions: { channelId: string; position: number }[],
    ): Promise<void> => {
        await apiClient.patch(`/api/v1/servers/${serverId}/channels/reorder`, {
            channelPositions,
        });
    },

    reorderCategories: async (
        serverId: string,
        categoryPositions: { categoryId: string; position: number }[],
    ): Promise<void> => {
        await apiClient.patch(
            `/api/v1/servers/${serverId}/categories/reorder`,
            {
                categoryPositions,
            },
        );
    },

    updateChannel: async (
        serverId: string,
        channelId: string,
        updates: Partial<Channel>,
    ): Promise<Channel> => {
        const response = await apiClient.patch<Channel>(
            `/api/v1/servers/${serverId}/channels/${channelId}`,
            updates,
        );
        return response.data;
    },

    updateServer: async (
        serverId: string,
        updates: Partial<Server>,
    ): Promise<Server> => {
        const response = await apiClient.patch<Server>(
            `/api/v1/servers/${serverId}`,
            updates,
        );
        return response.data;
    },

    uploadServerIcon: async (serverId: string, icon: File): Promise<string> => {
        const formData = new FormData();
        formData.append('icon', icon);
        const response = await apiClient.post<{ icon: string }>(
            `/api/v1/servers/${serverId}/icon`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
        );
        return response.data.icon;
    },

    uploadServerBanner: async (
        serverId: string,
        banner: File,
    ): Promise<string> => {
        const formData = new FormData();
        formData.append('banner', banner);
        const response = await apiClient.post<{ banner: string }>(
            `/api/v1/servers/${serverId}/banner`,
            formData,
            {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            },
        );
        return response.data.banner;
    },

    deleteServer: async (serverId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/servers/${serverId}`);
    },

    transferOwnership: async (
        serverId: string,
        newOwnerId: string,
    ): Promise<void> => {
        await apiClient.post(`/api/v1/servers/${serverId}/transfer-ownership`, {
            newOwnerId,
        });
    },

    createRole: async (
        serverId: string,
        data: {
            name: string;
            color?: string;
            permissions?: RolePermissions;
        },
    ): Promise<Role> => {
        const response = await apiClient.post<Role>(
            `/api/v1/servers/${serverId}/roles`,
            data,
        );
        return response.data;
    },

    updateRole: async (
        serverId: string,
        roleId: string,
        updates: Partial<Role> & { permissions?: RolePermissions },
    ): Promise<Role> => {
        const response = await apiClient.patch<Role>(
            `/api/v1/servers/${serverId}/roles/${roleId}`,
            updates,
        );
        return response.data;
    },

    deleteRole: async (serverId: string, roleId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/servers/${serverId}/roles/${roleId}`);
    },

    reorderRoles: async (
        serverId: string,
        rolePositions: { roleId: string; position: number }[],
    ): Promise<Role[]> => {
        const response = await apiClient.patch<Role[]>(
            `/api/v1/servers/${serverId}/roles/reorder`,
            {
                rolePositions,
            },
        );
        return response.data;
    },
};
