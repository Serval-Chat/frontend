/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { SystemInfoResponseDTO } from '../models/SystemInfoResponseDTO';

export class SystemService {
    /**
     * Retrieve Prometheus metrics
     * @param authorization
     * @returns string Prometheus metrics
     * @throws ApiError
     */
    public static metricsControllerGetMetrics(
        authorization: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/metrics',
            headers: {
                authorization: authorization,
            },
        });
    }
    /**
     * Get system info
     * @returns SystemInfoResponseDTO System info retrieved
     * @throws ApiError
     */
    public static systemControllerGetSystemInfo(): CancelablePromise<SystemInfoResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/system/info',
        });
    }
}
