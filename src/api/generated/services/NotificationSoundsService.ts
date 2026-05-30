/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { NotificationSoundDeletedResponseDTO } from '../models/NotificationSoundDeletedResponseDTO';
import type { NotificationSoundResponseDTO } from '../models/NotificationSoundResponseDTO';

export class NotificationSoundsService {
    /**
     * Upload a custom notification sound
     * @param formData
     * @returns NotificationSoundResponseDTO
     * @throws ApiError
     */
    public static notificationSoundControllerUploadSound(formData: {
        file?: Blob;
    }): CancelablePromise<NotificationSoundResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/notification-sounds/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Get all custom notification sounds
     * @returns NotificationSoundResponseDTO
     * @throws ApiError
     */
    public static notificationSoundControllerGetSounds(): CancelablePromise<
        Array<NotificationSoundResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/notification-sounds',
        });
    }
    /**
     * Delete a custom notification sound
     * @param id
     * @returns NotificationSoundDeletedResponseDTO
     * @throws ApiError
     */
    public static notificationSoundControllerDeleteSound(
        id: string,
    ): CancelablePromise<NotificationSoundDeletedResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/notification-sounds/{id}',
            path: {
                id: id,
            },
        });
    }
    /**
     * Serve a notification sound file
     * @param filename
     * @returns string Audio file
     * @throws ApiError
     */
    public static notificationSoundControllerPlaySound(
        filename: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/notification-sounds/play/{filename}',
            path: {
                filename: filename,
            },
        });
    }
}
