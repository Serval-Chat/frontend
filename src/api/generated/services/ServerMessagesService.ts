/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { BulkDeleteMessagesRequestDTO } from '../models/BulkDeleteMessagesRequestDTO';
import type { BulkDeleteResponseDTO } from '../models/BulkDeleteResponseDTO';
import type { GetMessageResponseDTO } from '../models/GetMessageResponseDTO';
import type { MessageDeletedResponseDTO } from '../models/MessageDeletedResponseDTO';
import type { PollVoteRequestDTO } from '../models/PollVoteRequestDTO';
import type { PollVoteResponseDTO } from '../models/PollVoteResponseDTO';
import type { SendMessageRequestDTO } from '../models/SendMessageRequestDTO';
import type { ServerEditMessageRequestDTO } from '../models/ServerEditMessageRequestDTO';
import type { ServerMessageResponseDTO } from '../models/ServerMessageResponseDTO';
import type { TogglePinResponseDTO } from '../models/TogglePinResponseDTO';
import type { ToggleStickyResponseDTO } from '../models/ToggleStickyResponseDTO';

export class ServerMessagesService {
    /**
     * Get channel messages
     * @param serverId
     * @param channelId
     * @param after
     * @param limit
     * @param before
     * @param around
     * @returns ServerMessageResponseDTO Messages retrieved
     * @throws ApiError
     */
    public static serverMessageControllerGetMessages(
        serverId: string,
        channelId: string,
        after: string,
        limit?: number,
        before?: string,
        around?: string,
    ): CancelablePromise<Array<ServerMessageResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/messages',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
            query: {
                limit: limit,
                before: before,
                around: around,
                after: after,
            },
            errors: {
                403: `Not a member of this server`,
            },
        });
    }
    /**
     * Send a message
     * @param serverId
     * @param channelId
     * @param requestBody
     * @returns ServerMessageResponseDTO Message sent
     * @throws ApiError
     */
    public static serverMessageControllerSendMessage(
        serverId: string,
        channelId: string,
        requestBody: SendMessageRequestDTO,
    ): CancelablePromise<ServerMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/messages',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Message text is required`,
                403: `No permission to send messages in this channel`,
                404: `Channel not found`,
            },
        });
    }
    /**
     * Get all pinned messages
     * @param serverId
     * @param channelId
     * @returns ServerMessageResponseDTO Pinned messages retrieved
     * @throws ApiError
     */
    public static serverMessageControllerGetPinnedMessages(
        serverId: string,
        channelId: string,
    ): CancelablePromise<Array<ServerMessageResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/messages/pins',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
            errors: {
                403: `Not a member of this server`,
            },
        });
    }
    /**
     * Get a message
     * @param serverId
     * @param channelId
     * @param messageId
     * @returns GetMessageResponseDTO Message retrieved
     * @throws ApiError
     */
    public static serverMessageControllerGetMessage(
        serverId: string,
        channelId: string,
        messageId: string,
    ): CancelablePromise<GetMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/messages/{messageId}',
            path: {
                serverId: serverId,
                channelId: channelId,
                messageId: messageId,
            },
            errors: {
                403: `Not a member of this server`,
                404: `Message not found`,
            },
        });
    }
    /**
     * Edit a message
     * @param serverId
     * @param channelId
     * @param messageId
     * @param requestBody
     * @returns ServerMessageResponseDTO Message updated
     * @throws ApiError
     */
    public static serverMessageControllerEditMessage(
        serverId: string,
        channelId: string,
        messageId: string,
        requestBody: ServerEditMessageRequestDTO,
    ): CancelablePromise<ServerMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/messages/{messageId}',
            path: {
                serverId: serverId,
                channelId: channelId,
                messageId: messageId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Message text is required`,
                403: `Only sender can edit message`,
                404: `Message not found`,
            },
        });
    }
    /**
     * Delete a message
     * @param serverId
     * @param channelId
     * @param messageId
     * @returns MessageDeletedResponseDTO Message deleted
     * @throws ApiError
     */
    public static serverMessageControllerDeleteMessage(
        serverId: string,
        channelId: string,
        messageId: string,
    ): CancelablePromise<MessageDeletedResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/messages/{messageId}',
            path: {
                serverId: serverId,
                channelId: channelId,
                messageId: messageId,
            },
            errors: {
                403: `No permission to delete message`,
                404: `Message not found`,
            },
        });
    }
    /**
     * Vote on a poll
     * @param serverId
     * @param channelId
     * @param messageId
     * @param requestBody
     * @returns PollVoteResponseDTO Vote registered
     * @throws ApiError
     */
    public static serverMessageControllerVotePoll(
        serverId: string,
        channelId: string,
        messageId: string,
        requestBody: PollVoteRequestDTO,
    ): CancelablePromise<PollVoteResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/messages/{messageId}/poll/vote',
            path: {
                serverId: serverId,
                channelId: channelId,
                messageId: messageId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid vote or not a poll`,
                403: `Not a member of this server`,
                404: `Message not found`,
            },
        });
    }
    /**
     * Bulk delete messages
     * @param serverId
     * @param channelId
     * @param requestBody
     * @returns BulkDeleteResponseDTO Messages deleted
     * @throws ApiError
     */
    public static serverMessageControllerBulkDeleteMessages(
        serverId: string,
        channelId: string,
        requestBody: BulkDeleteMessagesRequestDTO,
    ): CancelablePromise<BulkDeleteResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/messages/bulk-delete',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Toggle message pin
     * @param serverId
     * @param channelId
     * @param messageId
     * @returns TogglePinResponseDTO Pin status toggled
     * @throws ApiError
     */
    public static serverMessageControllerTogglePin(
        serverId: string,
        channelId: string,
        messageId: string,
    ): CancelablePromise<TogglePinResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/messages/{messageId}/pin',
            path: {
                serverId: serverId,
                channelId: channelId,
                messageId: messageId,
            },
            errors: {
                403: `No permission to pin messages`,
            },
        });
    }
    /**
     * Toggle message sticky
     * @param serverId
     * @param channelId
     * @param messageId
     * @returns ToggleStickyResponseDTO Sticky status toggled
     * @throws ApiError
     */
    public static serverMessageControllerToggleSticky(
        serverId: string,
        channelId: string,
        messageId: string,
    ): CancelablePromise<ToggleStickyResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/messages/{messageId}/sticky',
            path: {
                serverId: serverId,
                channelId: channelId,
                messageId: messageId,
            },
            errors: {
                403: `No permission to pin messages`,
            },
        });
    }
}
