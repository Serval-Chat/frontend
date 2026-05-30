/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { EmojiResponseDTO } from '../models/EmojiResponseDTO';

export class EmojisService {
    /**
     * Get all emojis accessible to the user
     * @returns EmojiResponseDTO
     * @throws ApiError
     */
    public static emojiControllerGetAllEmojis(): CancelablePromise<
        Array<EmojiResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/emojis',
        });
    }
    /**
     * Get a specific emoji by ID
     * @param emojiId
     * @returns EmojiResponseDTO
     * @throws ApiError
     */
    public static emojiControllerGetEmojiById(
        emojiId: string,
    ): CancelablePromise<EmojiResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/emojis/{emojiId}',
            path: {
                emojiId: emojiId,
            },
            errors: {
                404: `Emoji Not Found`,
            },
        });
    }
}
