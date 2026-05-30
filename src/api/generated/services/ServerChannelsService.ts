/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { CategoryResponseDTO } from '../models/CategoryResponseDTO';
import type { ChannelResponseDTO } from '../models/ChannelResponseDTO';
import type { ChannelStatsResponseDTO } from '../models/ChannelStatsResponseDTO';
import type { ChannelWithReadResponseDTO } from '../models/ChannelWithReadResponseDTO';
import type { CreateCategoryRequestDTO } from '../models/CreateCategoryRequestDTO';
import type { CreateChannelRequestDTO } from '../models/CreateChannelRequestDTO';
import type { MessageResponseDTO } from '../models/MessageResponseDTO';
import type { PermissionsResponseDTO } from '../models/PermissionsResponseDTO';
import type { ReorderCategoriesRequestDTO } from '../models/ReorderCategoriesRequestDTO';
import type { ReorderChannelsRequestDTO } from '../models/ReorderChannelsRequestDTO';
import type { ReorderResponseDTO } from '../models/ReorderResponseDTO';
import type { UpdateCategoryRequestDTO } from '../models/UpdateCategoryRequestDTO';
import type { UpdateChannelRequestDTO } from '../models/UpdateChannelRequestDTO';
import type { UpdatePermissionsRequestDTO } from '../models/UpdatePermissionsRequestDTO';
import type { VoiceTokenResponseDTO } from '../models/VoiceTokenResponseDTO';

export class ServerChannelsService {
    /**
     * Get server channels
     * @param serverId
     * @returns ChannelWithReadResponseDTO
     * @throws ApiError
     */
    public static serverChannelControllerGetChannels(
        serverId: string,
    ): CancelablePromise<Array<ChannelWithReadResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/channels',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Create channel
     * @param serverId
     * @param requestBody
     * @returns ChannelResponseDTO
     * @throws ApiError
     */
    public static serverChannelControllerCreateChannel(
        serverId: string,
        requestBody: CreateChannelRequestDTO,
    ): CancelablePromise<ChannelResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/channels',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get server categories
     * @param serverId
     * @returns CategoryResponseDTO
     * @throws ApiError
     */
    public static serverChannelControllerGetCategories(
        serverId: string,
    ): CancelablePromise<Array<CategoryResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/categories',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Create category
     * @param serverId
     * @param requestBody
     * @returns CategoryResponseDTO
     * @throws ApiError
     */
    public static serverChannelControllerCreateCategory(
        serverId: string,
        requestBody: CreateCategoryRequestDTO,
    ): CancelablePromise<CategoryResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/categories',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Reorder channels
     * @param serverId
     * @param requestBody
     * @returns ReorderResponseDTO Channels reordered
     * @throws ApiError
     */
    public static serverChannelControllerReorderChannels(
        serverId: string,
        requestBody: ReorderChannelsRequestDTO,
    ): CancelablePromise<ReorderResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}/channels/reorder',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get channel stats
     * @param serverId
     * @param channelId
     * @returns ChannelStatsResponseDTO
     * @throws ApiError
     */
    public static serverChannelControllerGetChannelStats(
        serverId: string,
        channelId: string,
    ): CancelablePromise<ChannelStatsResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/stats',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Channel Not Found`,
            },
        });
    }
    /**
     * Update channel
     * @param serverId
     * @param channelId
     * @param requestBody
     * @returns ChannelResponseDTO
     * @throws ApiError
     */
    public static serverChannelControllerUpdateChannel(
        serverId: string,
        channelId: string,
        requestBody: UpdateChannelRequestDTO,
    ): CancelablePromise<ChannelResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}/channels/{channelId}',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `Channel Not Found`,
            },
        });
    }
    /**
     * Delete channel
     * @param serverId
     * @param channelId
     * @returns MessageResponseDTO Channel deleted
     * @throws ApiError
     */
    public static serverChannelControllerDeleteChannel(
        serverId: string,
        channelId: string,
    ): CancelablePromise<MessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/channels/{channelId}',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
            errors: {
                403: `Forbidden`,
                404: `Channel Not Found`,
            },
        });
    }
    /**
     * Reorder categories
     * @param serverId
     * @param requestBody
     * @returns ReorderResponseDTO Categories reordered
     * @throws ApiError
     */
    public static serverChannelControllerReorderCategories(
        serverId: string,
        requestBody: ReorderCategoriesRequestDTO,
    ): CancelablePromise<ReorderResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}/categories/reorder',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Update category
     * @param serverId
     * @param categoryId
     * @param requestBody
     * @returns CategoryResponseDTO
     * @throws ApiError
     */
    public static serverChannelControllerUpdateCategory(
        serverId: string,
        categoryId: string,
        requestBody: UpdateCategoryRequestDTO,
    ): CancelablePromise<CategoryResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}/categories/{categoryId}',
            path: {
                serverId: serverId,
                categoryId: categoryId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `Category Not Found`,
            },
        });
    }
    /**
     * Delete category
     * @param serverId
     * @param categoryId
     * @returns MessageResponseDTO Category deleted
     * @throws ApiError
     */
    public static serverChannelControllerDeleteCategory(
        serverId: string,
        categoryId: string,
    ): CancelablePromise<MessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/categories/{categoryId}',
            path: {
                serverId: serverId,
                categoryId: categoryId,
            },
            errors: {
                403: `Forbidden`,
                404: `Category Not Found`,
            },
        });
    }
    /**
     * Get channel permissions
     * @param serverId
     * @param channelId
     * @returns PermissionsResponseDTO Permissions retrieved
     * @throws ApiError
     */
    public static serverChannelControllerGetChannelPermissions(
        serverId: string,
        channelId: string,
    ): CancelablePromise<PermissionsResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/permissions',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
            errors: {
                403: `Forbidden`,
                404: `Channel Not Found`,
            },
        });
    }
    /**
     * Update channel permissions
     * @param serverId
     * @param channelId
     * @param requestBody
     * @returns PermissionsResponseDTO Permissions updated
     * @throws ApiError
     */
    public static serverChannelControllerUpdateChannelPermissions(
        serverId: string,
        channelId: string,
        requestBody: UpdatePermissionsRequestDTO,
    ): CancelablePromise<PermissionsResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/permissions',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `Channel Not Found`,
            },
        });
    }
    /**
     * Get category permissions
     * @param serverId
     * @param categoryId
     * @returns PermissionsResponseDTO Permissions retrieved
     * @throws ApiError
     */
    public static serverChannelControllerGetCategoryPermissions(
        serverId: string,
        categoryId: string,
    ): CancelablePromise<PermissionsResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/categories/{categoryId}/permissions',
            path: {
                serverId: serverId,
                categoryId: categoryId,
            },
            errors: {
                403: `Forbidden`,
                404: `Category Not Found`,
            },
        });
    }
    /**
     * Update category permissions
     * @param serverId
     * @param categoryId
     * @param requestBody
     * @returns PermissionsResponseDTO Permissions updated
     * @throws ApiError
     */
    public static serverChannelControllerUpdateCategoryPermissions(
        serverId: string,
        categoryId: string,
        requestBody: UpdatePermissionsRequestDTO,
    ): CancelablePromise<PermissionsResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}/categories/{categoryId}/permissions',
            path: {
                serverId: serverId,
                categoryId: categoryId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `Category Not Found`,
            },
        });
    }
    /**
     * Get LiveKit voice channel token
     * @param serverId
     * @param channelId
     * @returns VoiceTokenResponseDTO Token generated successfully
     * @throws ApiError
     */
    public static serverChannelControllerGetVoiceToken(
        serverId: string,
        channelId: string,
    ): CancelablePromise<VoiceTokenResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/channels/{channelId}/voice-token',
            path: {
                serverId: serverId,
                channelId: channelId,
            },
            errors: {
                403: `Forbidden`,
                404: `Channel Not Found`,
            },
        });
    }
}
