/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { UserWarningResponseDTO } from '../models/UserWarningResponseDTO';

export class WarningsService {
    /**
     * Get current user's warnings
     * @param acknowledged
     * @returns UserWarningResponseDTO
     * @throws ApiError
     */
    public static userWarningControllerGetMyWarnings(
        acknowledged?: boolean,
    ): CancelablePromise<Array<UserWarningResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/warnings/me',
            query: {
                acknowledged: acknowledged,
            },
        });
    }
    /**
     * Acknowledge a warning
     * @param id
     * @returns UserWarningResponseDTO
     * @throws ApiError
     */
    public static userWarningControllerAcknowledgeWarning(
        id: string,
    ): CancelablePromise<UserWarningResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/warnings/{id}/acknowledge',
            path: {
                id: id,
            },
            errors: {
                400: `Warning ID is required`,
                403: `Forbidden`,
                404: `Warning Not Found`,
            },
        });
    }
}
