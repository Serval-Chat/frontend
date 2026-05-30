/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class ServersPublicService {
    /**
     * Get server icon
     * @param filename
     * @returns binary Icon file retrieved
     * @throws ApiError
     */
    public static serverPublicControllerGetServerIcon(
        filename: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/icon/{filename}',
            path: {
                filename: filename,
            },
            errors: {
                404: `File not found`,
            },
        });
    }
    /**
     * Get server banner
     * @param filename
     * @returns binary Banner file retrieved
     * @throws ApiError
     */
    public static serverPublicControllerGetServerBanner(
        filename: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/banner/{filename}',
            path: {
                filename: filename,
            },
            errors: {
                404: `File not found`,
            },
        });
    }
}
