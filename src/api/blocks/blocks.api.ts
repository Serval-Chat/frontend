import { apiClient } from '@/api/client';

export interface BlockProfile {
    id: string;
    name: string;
    flags: number;
    createdAt: string;
    updatedAt: string;
}

export interface BlockRelationship {
    targetUserId: string;
    targetUsername: string;
    profileId: string;
    flags: number;
}

export const blocksApi = {
    getProfiles: async (): Promise<BlockProfile[]> => {
        const response = await apiClient.get<BlockProfile[]>(
            '/api/v1/blocks/profiles',
        );
        return response.data;
    },
    createProfile: async (data: {
        name: string;
        flags: number;
    }): Promise<BlockProfile> => {
        const response = await apiClient.post<BlockProfile>(
            '/api/v1/blocks/profiles',
            data,
        );
        return response.data;
    },
    updateProfile: async (
        id: string,
        data: { name?: string; flags?: number },
    ): Promise<BlockProfile> => {
        const response = await apiClient.patch<BlockProfile>(
            `/api/v1/blocks/profiles/${id}`,
            data,
        );
        return response.data;
    },
    deleteProfile: async (id: string): Promise<void> => {
        await apiClient.delete(`/api/v1/blocks/profiles/${id}`);
    },

    getBlocks: async (): Promise<BlockRelationship[]> => {
        const response =
            await apiClient.get<BlockRelationship[]>('/api/v1/blocks');
        return response.data;
    },
    blockUser: async (
        targetUserId: string,
        profileId: string,
    ): Promise<BlockRelationship> => {
        const response = await apiClient.put<BlockRelationship>(
            `/api/v1/blocks/${targetUserId}`,
            {
                profileId,
            },
        );
        return response.data;
    },
    unblockUser: async (targetUserId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/blocks/${targetUserId}`);
    },
};
