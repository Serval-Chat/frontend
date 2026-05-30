/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { FavoriteGifResponseDTO } from '../models/FavoriteGifResponseDTO';
import type { GifMetadataResponseDTO } from '../models/GifMetadataResponseDTO';
import type { KlipySearchResponseDTO } from '../models/KlipySearchResponseDTO';
import type { ToggleFavoriteGifRequestDTO } from '../models/ToggleFavoriteGifRequestDTO';
import type { ToggleFavoriteResponseDTO } from '../models/ToggleFavoriteResponseDTO';

export class KlipyService {
    /**
     * Search for GIFs on Klipy
     * @param q
     * @returns KlipySearchResponseDTO
     * @throws ApiError
     */
    public static klipyControllerSearch(
        q: string,
    ): CancelablePromise<KlipySearchResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/klipy/search',
            query: {
                q: q,
            },
        });
    }
    /**
     * Get trending GIFs from Klipy
     * @returns KlipySearchResponseDTO
     * @throws ApiError
     */
    public static klipyControllerTrending(): CancelablePromise<KlipySearchResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/klipy/trending',
        });
    }
    /**
     * Search for stickers on Klipy
     * @param q
     * @returns KlipySearchResponseDTO
     * @throws ApiError
     */
    public static klipyControllerSearchStickers(
        q: string,
    ): CancelablePromise<KlipySearchResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/klipy/stickers/search',
            query: {
                q: q,
            },
        });
    }
    /**
     * Get trending stickers from Klipy
     * @returns KlipySearchResponseDTO
     * @throws ApiError
     */
    public static klipyControllerTrendingStickers(): CancelablePromise<KlipySearchResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/klipy/stickers/trending',
        });
    }
    /**
     * Resolve Klipy content metadata
     * @param id
     * @param type
     * @returns GifMetadataResponseDTO
     * @throws ApiError
     */
    public static klipyControllerResolve(
        id: string,
        type: string,
    ): CancelablePromise<GifMetadataResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/klipy/resolve',
            query: {
                id: id,
                type: type,
            },
        });
    }
    /**
     * Get user favorite GIFs
     * @returns FavoriteGifResponseDTO
     * @throws ApiError
     */
    public static klipyControllerGetFavorites(): CancelablePromise<
        Array<FavoriteGifResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/klipy/favorites',
        });
    }
    /**
     * Toggle GIF in favorites
     * @param requestBody
     * @returns ToggleFavoriteResponseDTO
     * @throws ApiError
     */
    public static klipyControllerToggleFavorite(
        requestBody: ToggleFavoriteGifRequestDTO,
    ): CancelablePromise<ToggleFavoriteResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/klipy/favorites/toggle',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
