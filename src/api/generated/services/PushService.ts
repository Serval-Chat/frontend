/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { FcmDto } from '../models/FcmDto';
import type { MigrateVapidDto } from '../models/MigrateVapidDto';
import type { PublicKeyResponseDTO } from '../models/PublicKeyResponseDTO';
import type { PushPreferencesResponseDTO } from '../models/PushPreferencesResponseDTO';
import type { SuccessResponseDTO } from '../models/SuccessResponseDTO';
import type { UpdatePreferencesDto } from '../models/UpdatePreferencesDto';
import type { VapidStatusResponseDTO } from '../models/VapidStatusResponseDTO';
import type { WebPushDto } from '../models/WebPushDto';

export class PushService {
    /**
     * Get VAPID public key
     * @returns PublicKeyResponseDTO
     * @throws ApiError
     */
    public static pushControllerGetVapidKey(): CancelablePromise<PublicKeyResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/push/vapid-public-key',
        });
    }
    /**
     * Get VAPID status
     * @returns VapidStatusResponseDTO
     * @throws ApiError
     */
    public static pushControllerVapidStatus(): CancelablePromise<VapidStatusResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/push/vapid-status',
        });
    }
    /**
     * Subscribe to web push
     * @param requestBody
     * @returns SuccessResponseDTO
     * @throws ApiError
     */
    public static pushControllerSubscribeWeb(
        requestBody: WebPushDto,
    ): CancelablePromise<SuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/push/subscribe/web',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Subscribe to FCM
     * @param requestBody
     * @returns SuccessResponseDTO
     * @throws ApiError
     */
    public static pushControllerSubscribeFcm(
        requestBody: FcmDto,
    ): CancelablePromise<SuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/push/subscribe/fcm',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Unsubscribe from all push notifications
     * @returns SuccessResponseDTO
     * @throws ApiError
     */
    public static pushControllerUnsubscribe(): CancelablePromise<SuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/push/unsubscribe',
        });
    }
    /**
     * Get notification preferences
     * @returns PushPreferencesResponseDTO
     * @throws ApiError
     */
    public static pushControllerGetPreferences(): CancelablePromise<PushPreferencesResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/push/preferences',
        });
    }
    /**
     * Update notification preferences
     * @param requestBody
     * @returns SuccessResponseDTO
     * @throws ApiError
     */
    public static pushControllerUpdatePreferences(
        requestBody: UpdatePreferencesDto,
    ): CancelablePromise<SuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/push/preferences',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Migrate VAPID subscription
     * @param requestBody
     * @returns SuccessResponseDTO
     * @throws ApiError
     */
    public static pushControllerMigrateVapid(
        requestBody: MigrateVapidDto,
    ): CancelablePromise<SuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/push/migrate-vapid',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
