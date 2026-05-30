/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { UpdateServerSettingsRequestDTO } from '../models/UpdateServerSettingsRequestDTO';
import type { UpdateServerSettingsResponseDTO } from '../models/UpdateServerSettingsResponseDTO';
import type { UpdateSettingsRequestDTO } from '../models/UpdateSettingsRequestDTO';
import type { UpdateSettingsResponseDTO } from '../models/UpdateSettingsResponseDTO';
import type { UserSettingsResponseDTO } from '../models/UserSettingsResponseDTO';

export class SettingsService {
    /**
     * Get user settings
     * @returns UserSettingsResponseDTO Settings retrieved
     * @throws ApiError
     */
    public static settingsControllerGetSettings(): CancelablePromise<UserSettingsResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/settings',
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Update user settings
     * @param requestBody
     * @returns UpdateSettingsResponseDTO Settings updated
     * @throws ApiError
     */
    public static settingsControllerUpdateSettings(
        requestBody: UpdateSettingsRequestDTO,
    ): CancelablePromise<UpdateSettingsResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/settings',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Update server settings (order and folders)
     * @param requestBody
     * @returns UpdateServerSettingsResponseDTO Server settings updated
     * @throws ApiError
     */
    public static settingsControllerUpdateServerSettings(
        requestBody: UpdateServerSettingsRequestDTO,
    ): CancelablePromise<UpdateServerSettingsResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/settings/server-settings',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
