/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { AddCustomReactionRequestDTO } from '../models/AddCustomReactionRequestDTO';
import type { AddUnicodeReactionRequestDTO } from '../models/AddUnicodeReactionRequestDTO';
import type { ReactionsListResponseDTO } from '../models/ReactionsListResponseDTO';
import type { RemoveCustomReactionRequestDTO } from '../models/RemoveCustomReactionRequestDTO';
import type { RemoveUnicodeReactionRequestDTO } from '../models/RemoveUnicodeReactionRequestDTO';

export class ReactionsService {
    /**
     * Get DM reactions
     * @param messageId
     * @returns ReactionsListResponseDTO Reactions retrieved successfully
     * @throws ApiError
     */
    public static reactionControllerGetDmReactions(
        messageId: string,
    ): CancelablePromise<ReactionsListResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/messages/{messageId}/reactions',
            path: {
                messageId: messageId,
            },
            errors: {
                403: `Forbidden`,
                404: `Message not found`,
            },
        });
    }
    /**
     * Add reaction to DM
     * @param messageId
     * @param requestBody
     * @returns ReactionsListResponseDTO Reaction added
     * @throws ApiError
     */
    public static reactionControllerAddDmReaction(
        messageId: string,
        requestBody: AddUnicodeReactionRequestDTO | AddCustomReactionRequestDTO,
    ): CancelablePromise<ReactionsListResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/messages/{messageId}/reactions',
            path: {
                messageId: messageId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid emoji or limit reached`,
                403: `Forbidden`,
                404: `Message not found`,
            },
        });
    }
    /**
     * Remove reaction from DM
     * @param messageId
     * @param requestBody
     * @returns ReactionsListResponseDTO Reaction removed
     * @throws ApiError
     */
    public static reactionControllerRemoveDmReaction(
        messageId: string,
        requestBody:
            | RemoveUnicodeReactionRequestDTO
            | RemoveCustomReactionRequestDTO,
    ): CancelablePromise<ReactionsListResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/messages/{messageId}/reactions',
            path: {
                messageId: messageId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `Message not found`,
            },
        });
    }
    /**
     * Add reaction to server message
     * @param serverId
     * @param channelId
     * @param messageId
     * @param requestBody
     * @returns ReactionsListResponseDTO Reaction added
     * @throws ApiError
     */
    public static reactionControllerAddServerReaction(
        serverId: string,
        channelId: string,
        messageId: string,
        requestBody: AddUnicodeReactionRequestDTO | AddCustomReactionRequestDTO,
    ): CancelablePromise<ReactionsListResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/messages/{messageId}/reactions',
            path: {
                serverId: serverId,
                channelId: channelId,
                messageId: messageId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid emoji or limit reached`,
                403: `Forbidden`,
                404: `Message or channel not found`,
            },
        });
    }
    /**
     * Remove reaction from server message
     * @param serverId
     * @param channelId
     * @param messageId
     * @param requestBody
     * @returns ReactionsListResponseDTO Reaction removed
     * @throws ApiError
     */
    public static reactionControllerRemoveServerReaction(
        serverId: string,
        channelId: string,
        messageId: string,
        requestBody:
            | RemoveUnicodeReactionRequestDTO
            | RemoveCustomReactionRequestDTO,
    ): CancelablePromise<ReactionsListResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/messages/{messageId}/reactions',
            path: {
                serverId: serverId,
                channelId: channelId,
                messageId: messageId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `Message or channel not found`,
            },
        });
    }
    /**
     * Get server reactions
     * @param serverId
     * @param channelId
     * @param messageId
     * @returns ReactionsListResponseDTO Reactions retrieved successfully
     * @throws ApiError
     */
    public static reactionControllerGetServerReactions(
        serverId: string,
        channelId: string,
        messageId: string,
    ): CancelablePromise<ReactionsListResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/messages/{messageId}/reactions',
            path: {
                serverId: serverId,
                channelId: channelId,
                messageId: messageId,
            },
            errors: {
                403: `Forbidden`,
                404: `Not found`,
            },
        });
    }
}
