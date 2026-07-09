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

export const BLOCKS_QUERY_KEYS = {
    profiles: ['blocks', 'profiles'] as const,
    list: ['blocks', 'list'] as const,
};

export const useBlockProfiles = (
    options: { enabled?: boolean } = {},
): UseQueryResult<BlockProfile[]> =>
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
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: BLOCKS_QUERY_KEYS.profiles,
            });
            showToast('Block profile created', 'success');
        },
        onError: (error: Error): void => {
            showToast(
                error.message === ''
                    ? 'Failed to create profile'
                    : error.message,
                'error',
            );
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
        }): Promise<BlockProfile> => blocksApi.updateProfile(id, data),
        onSuccess: (): void => {
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
        onError: (error: Error): void => {
            showToast(
                error.message === ''
                    ? 'Failed to update profile'
                    : error.message,
                'error',
            );
        },
    });
};

export const useDeleteBlockProfile = (): UseMutationResult<
    void,
    Error,
    string
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: blocksApi.deleteProfile,
        onSuccess: (): void => {
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
        onError: (error: Error): void => {
            showToast(
                error.message === ''
                    ? 'Failed to delete profile'
                    : error.message,
                'error',
            );
        },
    });
};

export const useBlocks = (
    options: { enabled?: boolean } = {},
): UseQueryResult<BlockRelationship[]> =>
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
        }): Promise<BlockRelationship> =>
            blocksApi.blockUser(targetUserId, profileId),
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: BLOCKS_QUERY_KEYS.list,
            });
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'members'],
            });
            showToast('User blocked', 'success');
        },
        onError: (error: Error): void => {
            showToast(
                error.message === '' ? 'Failed to block user' : error.message,
                'error',
            );
        },
    });
};

export const useRemoveBlock = (): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: blocksApi.unblockUser,
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: BLOCKS_QUERY_KEYS.list,
            });
            void queryClient.invalidateQueries({
                queryKey: ['servers', 'members'],
            });
            showToast('User unblocked', 'success');
        },
        onError: (error: Error): void => {
            showToast(
                error.message === '' ? 'Failed to unblock user' : error.message,
                'error',
            );
        },
    });
};

export { type BlockProfile, type BlockRelationship } from './blocks.api';
