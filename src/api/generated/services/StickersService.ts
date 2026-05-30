/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { StickerResponseDTO } from '../models/StickerResponseDTO';

export class StickersService {
    /**
     * Get all stickers accessible to the user
     * @returns StickerResponseDTO
     * @throws ApiError
     */
    public static stickerControllerGetAllStickers(): CancelablePromise<
        Array<StickerResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/stickers',
        });
    }
    /**
     * Get a specific sticker by ID
     * @param stickerId
     * @returns StickerResponseDTO
     * @throws ApiError
     */
    public static stickerControllerGetStickerById(
        stickerId: string,
    ): CancelablePromise<StickerResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/stickers/{stickerId}',
            path: {
                stickerId: stickerId,
            },
            errors: {
                404: `Sticker Not Found`,
            },
        });
    }
}
