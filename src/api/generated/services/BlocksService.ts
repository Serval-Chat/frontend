/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { BlockProfileResponseDTO } from '../models/BlockProfileResponseDTO';
import type { BlockRelationshipResponseDTO } from '../models/BlockRelationshipResponseDTO';
import type { CreateBlockProfileRequestDTO } from '../models/CreateBlockProfileRequestDTO';
import type { SimpleMessageResponseDTO } from '../models/SimpleMessageResponseDTO';
import type { UpdateBlockProfileRequestDTO } from '../models/UpdateBlockProfileRequestDTO';
import type { UpsertBlockRelationshipRequestDTO } from '../models/UpsertBlockRelationshipRequestDTO';

export class BlocksService {
    /**
     * Get all block profiles for the current user
     * @returns BlockProfileResponseDTO
     * @throws ApiError
     */
    public static blockControllerGetProfiles(): CancelablePromise<
        Array<BlockProfileResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/blocks/profiles',
        });
    }
    /**
     * Create a new block profile
     * @param requestBody
     * @returns BlockProfileResponseDTO
     * @throws ApiError
     */
    public static blockControllerCreateProfile(
        requestBody: CreateBlockProfileRequestDTO,
    ): CancelablePromise<BlockProfileResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/blocks/profiles',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Maximum profile limit reached`,
            },
        });
    }
    /**
     * Update an existing block profile
     * @param id
     * @param requestBody
     * @returns BlockProfileResponseDTO
     * @throws ApiError
     */
    public static blockControllerUpdateProfile(
        id: string,
        requestBody: UpdateBlockProfileRequestDTO,
    ): CancelablePromise<BlockProfileResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/blocks/profiles/{id}',
            path: {
                id: id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Profile not found`,
            },
        });
    }
    /**
     * Delete a block profile (cascade-deletes associated blocks)
     * @param id
     * @returns SimpleMessageResponseDTO Profile deleted
     * @throws ApiError
     */
    public static blockControllerDeleteProfile(
        id: string,
    ): CancelablePromise<SimpleMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/blocks/profiles/{id}',
            path: {
                id: id,
            },
            errors: {
                404: `Profile not found`,
            },
        });
    }
    /**
     * Get all users blocked by the current user
     * @returns BlockRelationshipResponseDTO
     * @throws ApiError
     */
    public static blockControllerGetBlocks(): CancelablePromise<
        Array<BlockRelationshipResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/blocks',
        });
    }
    /**
     * Block a user or update their block profile
     * @param targetUserId
     * @param requestBody
     * @returns BlockRelationshipResponseDTO
     * @throws ApiError
     */
    public static blockControllerBlockUser(
        targetUserId: string,
        requestBody: UpsertBlockRelationshipRequestDTO,
    ): CancelablePromise<BlockRelationshipResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/blocks/{targetUserId}',
            path: {
                targetUserId: targetUserId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Unblock a user
     * @param targetUserId
     * @returns void
     * @throws ApiError
     */
    public static blockControllerUnblockUser(
        targetUserId: string,
    ): CancelablePromise<void> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/blocks/{targetUserId}',
            path: {
                targetUserId: targetUserId,
            },
        });
    }
}
