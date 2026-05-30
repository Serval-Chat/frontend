/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { ClearChannelPingsResponseDTO } from '../models/ClearChannelPingsResponseDTO';
import type { DeletePingResponseDTO } from '../models/DeletePingResponseDTO';
import type { GetPingsResponseDTO } from '../models/GetPingsResponseDTO';

export class PingsService {
    /**
     * Get all pings for the current user
     * @returns GetPingsResponseDTO
     * @throws ApiError
     */
    public static userPingControllerGetPings(): CancelablePromise<GetPingsResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/pings',
        });
    }
    /**
     * Clear all pings for the current user
     * @returns DeletePingResponseDTO
     * @throws ApiError
     */
    public static userPingControllerClearAllPings(): CancelablePromise<DeletePingResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/pings',
        });
    }
    /**
     * Delete a specific ping
     * @param id
     * @returns DeletePingResponseDTO
     * @throws ApiError
     */
    public static userPingControllerDeletePing(
        id: string,
    ): CancelablePromise<DeletePingResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/pings/{id}',
            path: {
                id: id,
            },
            errors: {
                400: `Ping ID is required`,
            },
        });
    }
    /**
     * Clear all pings for a specific channel
     * @param channelId
     * @returns ClearChannelPingsResponseDTO
     * @throws ApiError
     */
    public static userPingControllerClearChannelPings(
        channelId: string,
    ): CancelablePromise<ClearChannelPingsResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/pings/channel/{channelId}',
            path: {
                channelId: channelId,
            },
            errors: {
                400: `Channel ID is required`,
            },
        });
    }
}
