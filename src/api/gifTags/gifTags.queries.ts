import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';
import type { AxiosError } from 'axios';

import type { KlipyFavorite } from '@/api/klipy/klipy.types';
import { useToast } from '@/ui/components/common/Toast';
import { hasAuthToken } from '@/utils/authToken';

import { type GifTag, gifTagsApi } from './gifTags.api';

export const GIF_TAG_QUERY_KEYS = {
    list: ['gif-tags', 'list'] as const,
};

export const getApiErrorMessage = (
    error: unknown,
    fallback: string,
): string => {
    const axiosError = error as AxiosError<{ error?: string }>;
    return axiosError?.response?.data?.error ?? fallback;
};

export const useGifTags = (
    options: { enabled?: boolean } = {},
): UseQueryResult<GifTag[]> =>
    useQuery({
        queryKey: GIF_TAG_QUERY_KEYS.list,
        queryFn: gifTagsApi.listTags,
        enabled: (options.enabled ?? true) && hasAuthToken(),
    });

export const useCreateGifTag = (): UseMutationResult<
    GifTag,
    Error,
    string
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: gifTagsApi.createTag,
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: GIF_TAG_QUERY_KEYS.list,
            });
        },
        onError: (error: Error): void => {
            showToast(
                getApiErrorMessage(error, 'Failed to create tag'),
                'error',
            );
        },
    });
};

export const useDeleteGifTag = (): UseMutationResult<void, Error, string> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: gifTagsApi.deleteTag,
        onSuccess: (): void => {
            void queryClient.invalidateQueries({
                queryKey: GIF_TAG_QUERY_KEYS.list,
            });
            void queryClient.invalidateQueries({
                queryKey: ['klipy', 'favorites'],
            });
            void queryClient.invalidateQueries({ queryKey: ['gif-picker'] });
        },
        onError: (error: Error): void => {
            showToast(
                getApiErrorMessage(error, 'Failed to delete tag'),
                'error',
            );
        },
    });
};

export const useAddTagsToGif = (): UseMutationResult<
    KlipyFavorite,
    Error,
    { klipyId: string; tagIds: string[] }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({
            klipyId,
            tagIds,
        }: {
            klipyId: string;
            tagIds: string[];
        }): Promise<KlipyFavorite> =>
            gifTagsApi.addTagsToGif(klipyId, tagIds),
        onSuccess: (updatedFav): void => {
            queryClient.setQueriesData<KlipyFavorite[]>(
                { queryKey: ['klipy', 'favorites'] },
                (old = []): KlipyFavorite[] =>
                    old.map((f): KlipyFavorite =>
                        String(f.klipyId) === String(updatedFav.klipyId)
                            ? { ...f, tagIds: updatedFav.tagIds ?? [] }
                            : f,
                    ),
            );
            void queryClient.invalidateQueries({
                queryKey: ['klipy', 'favorites'],
            });
            void queryClient.invalidateQueries({ queryKey: ['gif-picker'] });
        },
        onError: (error: Error): void => {
            showToast(
                getApiErrorMessage(error, 'Failed to add tag to GIF'),
                'error',
            );
        },
    });
};

export const useRemoveTagsFromGif = (): UseMutationResult<
    KlipyFavorite,
    Error,
    { klipyId: string; tagIds: string[] }
> => {
    const queryClient = useQueryClient();
    const { showToast } = useToast();

    return useMutation({
        mutationFn: ({
            klipyId,
            tagIds,
        }: {
            klipyId: string;
            tagIds: string[];
        }): Promise<KlipyFavorite> =>
            gifTagsApi.removeTagsFromGif(klipyId, tagIds),
        onSuccess: (updatedFav): void => {
            queryClient.setQueriesData<KlipyFavorite[]>(
                { queryKey: ['klipy', 'favorites'] },
                (old = []): KlipyFavorite[] =>
                    old.map((f): KlipyFavorite =>
                        String(f.klipyId) === String(updatedFav.klipyId)
                            ? { ...f, tagIds: updatedFav.tagIds ?? [] }
                            : f,
                    ),
            );
            void queryClient.invalidateQueries({
                queryKey: ['klipy', 'favorites'],
            });
            void queryClient.invalidateQueries({ queryKey: ['gif-picker'] });
        },
        onError: (error: Error): void => {
            showToast(
                getApiErrorMessage(error, 'Failed to remove tag from GIF'),
                'error',
            );
        },
    });
};

export { type GifTag } from './gifTags.api';
