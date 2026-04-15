import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { useToast } from '@/ui/components/common/Toast';
import { hasAuthToken } from '@/utils/authToken';

import {
    type BlockProfile,
    type BlockRelationship,
    blocksApi,
} from './blocks.api';

export type { BlockProfile, BlockRelationship };

export const BLOCKS_QUERY_KEYS = {
    profiles: ['blocks', 'profiles'] as const,
    list: ['blocks', 'list'] as const,
};

export const useBlockProfiles = (
    options: { enabled?: boolean } = {},
): UseQueryResult<BlockProfile[], Error> =>
    useQuery({
        queryKey: BLOCKS_QUERY_KEYS.profiles,
        queryFn: blocksApi.getProfiles,
        enabled: (options.enabled ?? true) && hasAuthToken(),
    });

export const useCreateBlockProfile = (): UseMutationResult<
    BlockProfile,
    Error,
    { name: string; flags: number }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: blocksApi.createProfile,
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: BLOCKS_QUERY_KEYS.profiles,
            });
            showToast('Block profile created', 'success');
        },
        onError: (error: Error) => {
            showToast(error.message || 'Failed to create profile', 'error');
        },
    });
};

export const useUpdateBlockProfile = (): UseMutationResult<
    BlockProfile,
    Error,
    { id: string; data: { name?: string; flags?: number } }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({
            id,
            data,
        }: {
            id: string;
            data: { name?: string; flags?: number };
        }) => blocksApi.updateProfile(id, data),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: BLOCKS_QUERY_KEYS.profiles,
            });
            void queryClient.invalidateQueries({
                queryKey: BLOCKS_QUERY_KEYS.list,
            });
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'members'],
            });
            showToast('Block profile updated', 'success');
        },
        onError: (error: Error) => {
            showToast(error.message || 'Failed to update profile', 'error');
        },
    });
};

export const useDeleteBlockProfile = (): UseMutationResult<
    Record<string, unknown>,
    Error,
    string
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: blocksApi.deleteProfile,
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: BLOCKS_QUERY_KEYS.profiles,
            });
            void queryClient.invalidateQueries({
                queryKey: BLOCKS_QUERY_KEYS.list,
            });
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'members'],
            });
            showToast('Block profile deleted', 'success');
        },
        onError: (error: Error) => {
            showToast(error.message || 'Failed to delete profile', 'error');
        },
    });
};

export const useBlocks = (
    options: { enabled?: boolean } = {},
): UseQueryResult<BlockRelationship[], Error> =>
    useQuery({
        queryKey: BLOCKS_QUERY_KEYS.list,
        queryFn: blocksApi.getBlocks,
        enabled: (options.enabled ?? true) && hasAuthToken(),
    });

export const useUpsertBlock = (): UseMutationResult<
    BlockRelationship,
    Error,
    { targetUserId: string; profileId: string }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({
            targetUserId,
            profileId,
        }: {
            targetUserId: string;
            profileId: string;
        }) => blocksApi.blockUser(targetUserId, profileId),
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: BLOCKS_QUERY_KEYS.list,
            });
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'members'],
            });
            showToast('User blocked', 'success');
        },
        onError: (error: Error) => {
            showToast(error.message || 'Failed to block user', 'error');
        },
    });
};

export const useRemoveBlock = (): UseMutationResult<
    Record<string, unknown>,
    Error,
    string
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: blocksApi.unblockUser,
        onSuccess: () => {
            void queryClient.invalidateQueries({
                queryKey: BLOCKS_QUERY_KEYS.list,
            });
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'members'],
            });
            showToast('User unblocked', 'success');
        },
        onError: (error: Error) => {
            showToast(error.message || 'Failed to unblock user', 'error');
        },
    });
};
