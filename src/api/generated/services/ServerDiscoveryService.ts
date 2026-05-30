/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { DiscoveryServersResponseDTO } from '../models/DiscoveryServersResponseDTO';

export class ServerDiscoveryService {
    /**
     * Search discoverable servers
     * @param q
     * @param tags
     * @param limit
     * @param cursor
     * @returns DiscoveryServersResponseDTO
     * @throws ApiError
     */
    public static serverDiscoveryControllerListServers(
        q?: string,
        tags?: Array<string>,
        limit?: number,
        cursor?: string,
    ): CancelablePromise<DiscoveryServersResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/discovery/servers',
            query: {
                q: q,
                tags: tags,
                limit: limit,
                cursor: cursor,
            },
        });
    }
}
