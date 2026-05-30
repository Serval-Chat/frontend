/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { EmojiResponseDTO } from '../models/EmojiResponseDTO';

export class ServerEmojisService {
    /**
     * Get all server emojis
     * @param serverId
     * @returns EmojiResponseDTO Server emojis retrieved
     * @throws ApiError
     */
    public static serverEmojiControllerGetServerEmojis(
        serverId: string,
    ): CancelablePromise<Array<EmojiResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/emojis',
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
     * Upload a server emoji
     * @param serverId
     * @param formData
     * @returns EmojiResponseDTO Emoji uploaded
     * @throws ApiError
     */
    public static serverEmojiControllerUploadEmoji(
        serverId: string,
        formData: {
            emoji?: Blob;
            name?: string;
        },
    ): CancelablePromise<EmojiResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/emojis',
            path: {
                serverId: serverId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Emoji file is required`,
                403: `Insufficient permissions`,
                409: `Emoji name already exists`,
            },
        });
    }
    /**
     * Get a specific emoji
     * @param serverId
     * @param emojiId
     * @returns EmojiResponseDTO Emoji retrieved
     * @throws ApiError
     */
    public static serverEmojiControllerGetEmoji(
        serverId: string,
        emojiId: string,
    ): CancelablePromise<EmojiResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/emojis/{emojiId}',
            path: {
                serverId: serverId,
                emojiId: emojiId,
            },
            errors: {
                403: `Not a member of this server`,
                404: `Emoji not found`,
            },
        });
    }
    /**
     * Delete a server emoji
     * @param serverId
     * @param emojiId
     * @returns void
     * @throws ApiError
     */
    public static serverEmojiControllerDeleteEmoji(
        serverId: string,
        emojiId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/emojis/{emojiId}',
            path: {
                serverId: serverId,
                emojiId: emojiId,
            },
            errors: {
                403: `Insufficient permissions`,
                404: `Emoji not found`,
            },
        });
    }
}
