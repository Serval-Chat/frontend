import { apiClient } from '@/api/client';

import type {
    KlipyFavorite,
    KlipyGif,
    KlipySearchResponse,
} from './klipy.types';

export const klipyApi = {
    getTrendingGifs: async (): Promise<KlipyGif[]> => {
        const response = await apiClient.get<KlipySearchResponse>(
            '/api/v1/klipy/trending',
        );
        return response.data.data.data.map((g) => ({
            ...g,
            contentType: 'gif',
        }));
    },

    searchGifs: async (query: string): Promise<KlipyGif[]> => {
        const response = await apiClient.get<KlipySearchResponse>(
            `/api/v1/klipy/search?q=${encodeURIComponent(query)}`,
        );
        return response.data.data.data.map((g) => ({
            ...g,
            contentType: 'gif',
        }));
    },

    getTrendingStickers: async (): Promise<KlipyGif[]> => {
        const response = await apiClient.get<KlipySearchResponse>(
            '/api/v1/klipy/stickers/trending',
        );
        return response.data.data.data.map((s) => ({
            ...s,
            contentType: 'sticker',
        }));
    },

    searchStickers: async (query: string): Promise<KlipyGif[]> => {
        const response = await apiClient.get<KlipySearchResponse>(
            `/api/v1/klipy/stickers/search?q=${encodeURIComponent(query)}`,
        );
        return response.data.data.data.map((s) => ({
            ...s,
            contentType: 'sticker',
        }));
    },

    getFavorites: async (): Promise<KlipyFavorite[]> => {
        const response = await apiClient.get<KlipyFavorite[]>(
            '/api/v1/klipy/favorites',
        );
        return response.data;
    },

    resolveGif: async (
        klipyId: string,
        type: 'gif' | 'sticker' = 'gif',
    ): Promise<KlipyFavorite> => {
        const response = await apiClient.get<KlipyFavorite>(
            `/api/v1/klipy/resolve?id=${klipyId}&type=${type}`,
        );
        return response.data;
    },

    toggleFavorite: async (params: {
        klipyId: string;
        url: string;
        previewUrl: string;
        width: number;
        height: number;
        contentType?: 'gif' | 'sticker';
    }): Promise<{ favorited: boolean }> => {
        const response = await apiClient.post<{ favorited: boolean }>(
            '/api/v1/klipy/favorites/toggle',
            {
                ...params,
                klipyId: String(params.klipyId),
            },
        );
        return response.data;
    },
};
