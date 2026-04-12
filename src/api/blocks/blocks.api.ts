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
    getProfiles: () =>
        apiClient
            .get<BlockProfile[]>('/api/v1/blocks/profiles')
            .then((res: { data: BlockProfile[] }) => res.data),
    createProfile: (data: { name: string; flags: number }) =>
        apiClient
            .post<BlockProfile>('/api/v1/blocks/profiles', data)
            .then((res: { data: BlockProfile }) => res.data),
    updateProfile: (id: string, data: { name?: string; flags?: number }) =>
        apiClient
            .patch<BlockProfile>(`/api/v1/blocks/profiles/${id}`, data)
            .then((res: { data: BlockProfile }) => res.data),
    deleteProfile: (id: string) =>
        apiClient
            .delete(`/api/v1/blocks/profiles/${id}`)
            .then((res: { data: Record<string, unknown> }) => res.data),

    getBlocks: () =>
        apiClient
            .get<BlockRelationship[]>('/api/v1/blocks')
            .then((res: { data: BlockRelationship[] }) => res.data),
    blockUser: (targetUserId: string, profileId: string) =>
        apiClient
            .put<BlockRelationship>(`/api/v1/blocks/${targetUserId}`, {
                profileId,
            })
            .then((res: { data: BlockRelationship }) => res.data),
    unblockUser: (targetUserId: string) =>
        apiClient
            .delete(`/api/v1/blocks/${targetUserId}`)
            .then((res: { data: Record<string, unknown> }) => res.data),
};
