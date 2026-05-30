/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { StickerResponseDTO } from '../models/StickerResponseDTO';

export class ServerStickersService {
    /**
     * Get all server stickers
     * @param serverId
     * @returns StickerResponseDTO Server stickers retrieved
     * @throws ApiError
     */
    public static serverStickerControllerGetServerStickers(
        serverId: string,
    ): CancelablePromise<Array<StickerResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/stickers',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Not a member of this server`,
                404: `Server not found`,
            },
        });
    }
    /**
     * Upload a server sticker
     * @param serverId
     * @param formData
     * @returns StickerResponseDTO Sticker uploaded
     * @throws ApiError
     */
    public static serverStickerControllerUploadSticker(
        serverId: string,
        formData: {
            sticker?: Blob;
            name?: string;
        },
    ): CancelablePromise<StickerResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/stickers',
            path: {
                serverId: serverId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `File required or invalid name`,
                403: `Insufficient permissions`,
                409: `Name exists`,
            },
        });
    }
    /**
     * Get a specific sticker
     * @param serverId
     * @param stickerId
     * @returns StickerResponseDTO Sticker retrieved
     * @throws ApiError
     */
    public static serverStickerControllerGetSticker(
        serverId: string,
        stickerId: string,
    ): CancelablePromise<StickerResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/stickers/{stickerId}',
            path: {
                serverId: serverId,
                stickerId: stickerId,
            },
            errors: {
                403: `Not a member of this server`,
                404: `Sticker not found`,
            },
        });
    }
    /**
     * Delete a server sticker
     * @param serverId
     * @param stickerId
     * @returns void
     * @throws ApiError
     */
    public static serverStickerControllerDeleteSticker(
        serverId: string,
        stickerId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/stickers/{stickerId}',
            path: {
                serverId: serverId,
                stickerId: stickerId,
            },
            errors: {
                403: `Insufficient permissions`,
                404: `Sticker not found`,
            },
        });
    }
}
