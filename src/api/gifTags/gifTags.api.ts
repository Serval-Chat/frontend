import { apiClient } from '@/api/client';
import type { KlipyFavorite } from '@/api/klipy/klipy.types';

export interface GifTag {
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
}

export const gifTagsApi = {
    listTags: async (): Promise<GifTag[]> => {
        const response = await apiClient.get<GifTag[]>('/api/v1/gif-tags');
        return response.data;
    },

    createTag: async (name: string): Promise<GifTag> => {
        const response = await apiClient.post<GifTag>('/api/v1/gif-tags', {
            name,
        });
        return response.data;
    },

    deleteTag: async (tagId: string): Promise<void> => {
        await apiClient.delete(`/api/v1/gif-tags/${tagId}`);
    },

    addTagsToGif: async (
        klipyId: string,
        tagIds: string[],
    ): Promise<KlipyFavorite> => {
        const response = await apiClient.post<KlipyFavorite>(
            `/api/v1/gif-tags/gifs/${encodeURIComponent(klipyId)}`,
            { tagIds },
        );
        return response.data;
    },

    removeTagsFromGif: async (
        klipyId: string,
        tagIds: string[],
    ): Promise<KlipyFavorite> => {
        const response = await apiClient.delete<KlipyFavorite>(
            `/api/v1/gif-tags/gifs/${encodeURIComponent(klipyId)}`,
            { data: { tagIds } },
        );
        return response.data;
    },

    searchFavorites: async (expression: string): Promise<KlipyFavorite[]> => {
        const response = await apiClient.get<KlipyFavorite[]>(
            '/api/v1/gif-tags/search',
            { params: { expression } },
        );
        return response.data;
    },
};
