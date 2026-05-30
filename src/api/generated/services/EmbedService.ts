/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';

export class EmbedService {
    /**
     * Proxy and cache an image from the scraper service
     * @param file
     * @returns string Proxied image
     * @throws ApiError
     */
    public static embedControllerProxyImage(
        file: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/embed/proxy-image',
            query: {
                file: file,
            },
        });
    }
    /**
     * Proxy an allowlisted external URL
     * @param url
     * @returns string Proxied image
     * @throws ApiError
     */
    public static embedControllerProxy(url: string): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/embed/proxy',
            query: {
                url: url,
            },
        });
    }
}
