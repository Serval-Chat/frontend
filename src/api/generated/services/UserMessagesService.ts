/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { DmMessageDeleteResponseDTO } from '../models/DmMessageDeleteResponseDTO';
import type { DmMessageListResponseDTO } from '../models/DmMessageListResponseDTO';
import type { DmMessageResponseDTO } from '../models/DmMessageResponseDTO';
import type { DmPollVoteResponseDTO } from '../models/DmPollVoteResponseDTO';
import type { PollVoteRequestDTO } from '../models/PollVoteRequestDTO';
import type { UnreadCountsResponseDTO } from '../models/UnreadCountsResponseDTO';
import type { UserEditMessageRequestDTO } from '../models/UserEditMessageRequestDTO';

export class UserMessagesService {
    /**
     * Get unread counts
     * @returns UnreadCountsResponseDTO Unread counts retrieved
     * @throws ApiError
     */
    public static userMessageControllerGetUnreadCounts(): CancelablePromise<UnreadCountsResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/messages/unread',
        });
    }
    /**
     * Get messages
     * @param userId
     * @param limit
     * @param before
     * @param around
     * @param after
     * @returns DmMessageListResponseDTO Messages retrieved
     * @throws ApiError
     */
    public static userMessageControllerGetMessages(
        userId: string,
        limit?: number,
        before?: string,
        around?: string,
        after?: string,
    ): CancelablePromise<DmMessageListResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/messages',
            query: {
                userId: userId,
                limit: limit,
                before: before,
                around: around,
                after: after,
            },
            errors: {
                400: `User ID is required`,
                403: `Users are not friends`,
                404: `User not found`,
            },
        });
    }
    /**
     * Get message by ID
     * @param id
     * @param userId
     * @returns DmMessageResponseDTO Message retrieved
     * @throws ApiError
     */
    public static userMessageControllerGetMessage(
        id: string,
        userId: string,
    ): CancelablePromise<DmMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/messages/{id}',
            path: {
                id: id,
            },
            query: {
                userId: userId,
            },
            errors: {
                403: `Users are not friends`,
                404: `Message not found`,
            },
        });
    }
    /**
     * Edit message
     * @param id
     * @param requestBody
     * @returns DmMessageResponseDTO Message updated
     * @throws ApiError
     */
    public static userMessageControllerEditMessage(
        id: string,
        requestBody: UserEditMessageRequestDTO,
    ): CancelablePromise<DmMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/messages/{id}',
            path: {
                id: id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Unauthorized`,
                404: `Message not found`,
            },
        });
    }
    /**
     * Delete message
     * @param id
     * @returns DmMessageDeleteResponseDTO Message deleted
     * @throws ApiError
     */
    public static userMessageControllerDeleteMessage(
        id: string,
    ): CancelablePromise<DmMessageDeleteResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/messages/{id}',
            path: {
                id: id,
            },
            errors: {
                403: `Unauthorized`,
                404: `Message not found`,
            },
        });
    }
    /**
     * Get user message
     * @param userId
     * @param messageId
     * @returns DmMessageResponseDTO Message retrieved
     * @throws ApiError
     */
    public static userMessageControllerGetUserMessage(
        userId: string,
        messageId: string,
    ): CancelablePromise<DmMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/messages/{userId}/{messageId}',
            path: {
                userId: userId,
                messageId: messageId,
            },
            errors: {
                403: `Users are not friends`,
                404: `Message not found`,
            },
        });
    }
    /**
     * Vote on a poll
     * @param id
     * @param requestBody
     * @returns DmPollVoteResponseDTO Vote registered
     * @throws ApiError
     */
    public static userMessageControllerVotePoll(
        id: string,
        requestBody: PollVoteRequestDTO,
    ): CancelablePromise<DmPollVoteResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/messages/{id}/poll/vote',
            path: {
                id: id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid vote or not a poll`,
                403: `Unauthorized`,
                404: `Message not found`,
            },
        });
    }
}
