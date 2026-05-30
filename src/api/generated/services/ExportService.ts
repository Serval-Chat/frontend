/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { ExportRequestResponseDTO } from '../models/ExportRequestResponseDTO';
import type { ExportStateResponseDTO } from '../models/ExportStateResponseDTO';

export class ExportService {
    /**
     * Get export state for a channel
     * @param serverId
     * @param channelId
     * @returns ExportStateResponseDTO
     * @throws ApiError
     */
    public static exportControllerGetExportState(
        serverId: string,
        channelId: string,
    ): CancelablePromise<ExportStateResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/export-state',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
        });
    }
    /**
     * Request message export for a channel
     * @param serverId
     * @param channelId
     * @returns ExportRequestResponseDTO
     * @throws ApiError
     */
    public static exportControllerRequestExport(
        serverId: string,
        channelId: string,
    ): CancelablePromise<ExportRequestResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/export',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
        });
    }
    /**
     * Download exported file
     * @param token
     * @returns string Export JSON file
     * @throws ApiError
     */
    public static exportControllerDownloadExport(
        token: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/exports/download/{token}',
            path: {
                token: token,
            },
        });
    }
}
