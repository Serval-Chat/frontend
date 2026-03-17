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
        return response.data.data.data;
    },

    searchGifs: async (query: string): Promise<KlipyGif[]> => {
        const response = await apiClient.get<KlipySearchResponse>(
            `/api/v1/klipy/search?q=${encodeURIComponent(query)}`,
        );
        return response.data.data.data;
    },

    getFavorites: async (): Promise<KlipyFavorite[]> => {
        const response = await apiClient.get<KlipyFavorite[]>(
            '/api/v1/klipy/favorites',
        );
        return response.data;
    },

    resolveGif: async (klipyId: string): Promise<KlipyFavorite> => {
        const response = await apiClient.get<KlipyFavorite>(
            `/api/v1/klipy/resolve?id=${klipyId}`,
        );
        return response.data;
    },

    toggleFavorite: async (params: {
        klipyId: string;
        url: string;
        previewUrl: string;
        width: number;
        height: number;
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
