/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { AvatarUploadResponseDTO } from '../models/AvatarUploadResponseDTO';
import type { CreateWebhookRequestDTO } from '../models/CreateWebhookRequestDTO';
import type { ExecuteWebhookRequestDTO } from '../models/ExecuteWebhookRequestDTO';
import type { SimpleMessageResponseDTO } from '../models/SimpleMessageResponseDTO';
import type { WebhookExecuteResponseDTO } from '../models/WebhookExecuteResponseDTO';
import type { WebhookResponseDTO } from '../models/WebhookResponseDTO';

export class WebhooksService {
    /**
     * Get webhooks
     * @param serverId
     * @param channelId
     * @returns WebhookResponseDTO Webhooks retrieved
     * @throws ApiError
     */
    public static webhookControllerGetWebhooks(
        serverId: string,
        channelId: string,
    ): CancelablePromise<Array<WebhookResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/webhooks',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
            errors: {
                403: `No permission to manage webhooks`,
                404: `Channel not found`,
            },
        });
    }
    /**
     * Create webhook
     * @param serverId
     * @param channelId
     * @param requestBody
     * @returns WebhookResponseDTO Webhook created
     * @throws ApiError
     */
    public static webhookControllerCreateWebhook(
        serverId: string,
        channelId: string,
        requestBody: CreateWebhookRequestDTO,
    ): CancelablePromise<WebhookResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/webhooks',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `No permission to manage webhooks`,
            },
        });
    }
    /**
     * Delete webhook
     * @param serverId
     * @param channelId
     * @param webhookId
     * @returns SimpleMessageResponseDTO Webhook deleted
     * @throws ApiError
     */
    public static webhookControllerDeleteWebhook(
        serverId: string,
        channelId: string,
        webhookId: string,
    ): CancelablePromise<SimpleMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/webhooks/{webhookId}',
            path: {
                serverId: serverId,
                channelId: channelId,
                webhookId: webhookId,
            },
            errors: {
                403: `No permission to manage webhooks`,
                404: `Webhook not found`,
            },
        });
    }
    /**
     * Upload webhook avatar
     * @param serverId
     * @param channelId
     * @param webhookId
     * @param formData
     * @returns AvatarUploadResponseDTO Avatar uploaded
     * @throws ApiError
     */
    public static webhookControllerUploadWebhookAvatar(
        serverId: string,
        channelId: string,
        webhookId: string,
        formData: {
            avatar?: Blob;
        },
    ): CancelablePromise<AvatarUploadResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/webhooks/{webhookId}/avatar',
            path: {
                serverId: serverId,
                channelId: channelId,
                webhookId: webhookId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                403: `No permission to manage webhooks`,
            },
        });
    }
    /**
     * Get webhook avatar
     * @param filename
     * @returns binary Avatar retrieved
     * @throws ApiError
     */
    public static webhookControllerGetWebhookAvatar(
        filename: string,
    ): CancelablePromise<Blob> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/webhooks/avatar/{filename}',
            path: {
                filename: filename,
            },
            errors: {
                404: `Avatar not found`,
            },
        });
    }
    /**
     * Execute webhook
     * @param token
     * @param requestBody
     * @returns WebhookExecuteResponseDTO Webhook executed
     * @throws ApiError
     */
    public static webhookControllerExecuteWebhook(
        token: string,
        requestBody: ExecuteWebhookRequestDTO,
    ): CancelablePromise<WebhookExecuteResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/webhooks/{token}',
            path: {
                token: token,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Invalid webhook token`,
                404: `Webhook not found`,
            },
        });
    }
    /**
     * Edit webhook message
     * @param token
     * @param messageId
     * @param requestBody
     * @returns SimpleMessageResponseDTO Webhook message edited
     * @throws ApiError
     */
    public static webhookControllerEditWebhookMessage(
        token: string,
        messageId: string,
        requestBody: ExecuteWebhookRequestDTO,
    ): CancelablePromise<SimpleMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/webhooks/{token}/messages/{messageId}',
            path: {
                token: token,
                messageId: messageId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Message not found`,
            },
        });
    }
    /**
     * Delete webhook message
     * @param token
     * @param messageId
     * @returns SimpleMessageResponseDTO Webhook message deleted
     * @throws ApiError
     */
    public static webhookControllerDeleteWebhookMessage(
        token: string,
        messageId: string,
    ): CancelablePromise<SimpleMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/webhooks/{token}/messages/{messageId}',
            path: {
                token: token,
                messageId: messageId,
            },
            errors: {
                404: `Message not found`,
            },
        });
    }
}
