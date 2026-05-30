/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { AuthorizeBotRequestDTO } from '../models/AuthorizeBotRequestDTO';
import type { BotAuthorizeResponseDTO } from '../models/BotAuthorizeResponseDTO';
import type { BotDeleteResponseDTO } from '../models/BotDeleteResponseDTO';
import type { BotPublicInfoResponseDTO } from '../models/BotPublicInfoResponseDTO';
import type { BotResponseDTO } from '../models/BotResponseDTO';
import type { BotSecretResponseDTO } from '../models/BotSecretResponseDTO';
import type { BotServerCountResponseDTO } from '../models/BotServerCountResponseDTO';
import type { BotTokenResponseDTO } from '../models/BotTokenResponseDTO';
import type { BotUploadBannerResponseDTO } from '../models/BotUploadBannerResponseDTO';
import type { BotUploadPictureResponseDTO } from '../models/BotUploadPictureResponseDTO';
import type { CreateBotRequestDTO } from '../models/CreateBotRequestDTO';
import type { CreateBotResponseDTO } from '../models/CreateBotResponseDTO';
import type { GetBotTokenRequestDTO } from '../models/GetBotTokenRequestDTO';
import type { SlashCommandDTO } from '../models/SlashCommandDTO';
import type { UpdateBotCommandsRequestDTO } from '../models/UpdateBotCommandsRequestDTO';
import type { UpdateBotPermissionsRequestDTO } from '../models/UpdateBotPermissionsRequestDTO';
import type { UpdateBotRequestDTO } from '../models/UpdateBotRequestDTO';

export class BotsService {
    /**
     * Public bot info (no auth)
     * @param clientId
     * @returns BotPublicInfoResponseDTO
     * @throws ApiError
     */
    public static botControllerGetPublicInfo(
        clientId: string,
    ): CancelablePromise<BotPublicInfoResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bots/{clientId}/public',
            path: {
                clientId: clientId,
            },
        });
    }
    /**
     * Exchange client credentials for a bot token
     * @param requestBody
     * @returns BotTokenResponseDTO
     * @throws ApiError
     */
    public static botControllerGetToken(
        requestBody: GetBotTokenRequestDTO,
    ): CancelablePromise<BotTokenResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/bots/token',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Create a new bot application
     * @param requestBody
     * @returns CreateBotResponseDTO
     * @throws ApiError
     */
    public static botControllerCreateBot(
        requestBody: CreateBotRequestDTO,
    ): CancelablePromise<CreateBotResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/bots',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List caller's bots
     * @returns BotResponseDTO
     * @throws ApiError
     */
    public static botControllerListBots(): CancelablePromise<
        Array<BotResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bots',
        });
    }
    /**
     * Get bot detail (owner only)
     * @param clientId
     * @returns BotResponseDTO
     * @throws ApiError
     */
    public static botControllerGetBot(
        clientId: string,
    ): CancelablePromise<BotResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bots/{clientId}',
            path: {
                clientId: clientId,
            },
        });
    }
    /**
     * Update bot name/description/avatar (owner only)
     * @param clientId
     * @param requestBody
     * @returns BotResponseDTO
     * @throws ApiError
     */
    public static botControllerUpdateBot(
        clientId: string,
        requestBody: UpdateBotRequestDTO,
    ): CancelablePromise<BotResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/bots/{clientId}',
            path: {
                clientId: clientId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Delete bot (owner only)
     * @param clientId
     * @returns BotDeleteResponseDTO
     * @throws ApiError
     */
    public static botControllerDeleteBot(
        clientId: string,
    ): CancelablePromise<BotDeleteResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/bots/{clientId}',
            path: {
                clientId: clientId,
            },
        });
    }
    /**
     * Update bot API permissions (owner only)
     * @param clientId
     * @param requestBody
     * @returns BotResponseDTO
     * @throws ApiError
     */
    public static botControllerUpdatePermissions(
        clientId: string,
        requestBody: UpdateBotPermissionsRequestDTO,
    ): CancelablePromise<BotResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/bots/{clientId}/permissions',
            path: {
                clientId: clientId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Reset bot client secret (owner only)
     * @param clientId
     * @returns BotSecretResponseDTO
     * @throws ApiError
     */
    public static botControllerResetSecret(
        clientId: string,
    ): CancelablePromise<BotSecretResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/bots/{clientId}/reset-secret',
            path: {
                clientId: clientId,
            },
        });
    }
    /**
     * Invalidate all existing bot tokens and return a new one (owner only)
     * @param clientId
     * @returns BotTokenResponseDTO
     * @throws ApiError
     */
    public static botControllerResetToken(
        clientId: string,
    ): CancelablePromise<BotTokenResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/bots/{clientId}/reset-token',
            path: {
                clientId: clientId,
            },
        });
    }
    /**
     * Authorize bot to join a server (any server manager)
     * @param clientId
     * @param requestBody
     * @returns BotAuthorizeResponseDTO
     * @throws ApiError
     */
    public static botControllerAuthorizeToServer(
        clientId: string,
        requestBody: AuthorizeBotRequestDTO,
    ): CancelablePromise<BotAuthorizeResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/bots/{clientId}/authorize',
            path: {
                clientId: clientId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * List servers the bot is in (owner only)
     * @param clientId
     * @returns BotServerCountResponseDTO
     * @throws ApiError
     */
    public static botControllerGetBotServers(
        clientId: string,
    ): CancelablePromise<BotServerCountResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bots/{clientId}/servers',
            path: {
                clientId: clientId,
            },
        });
    }
    /**
     * Get slash commands for bot
     * @param clientId
     * @returns SlashCommandDTO
     * @throws ApiError
     */
    public static botControllerGetBotCommands(
        clientId: string,
    ): CancelablePromise<Array<SlashCommandDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/bots/{clientId}/commands',
            path: {
                clientId: clientId,
            },
        });
    }
    /**
     * Overwrite slash commands for bot
     * @param clientId
     * @param requestBody
     * @returns SlashCommandDTO
     * @throws ApiError
     */
    public static botControllerUpdateBotCommands(
        clientId: string,
        requestBody: UpdateBotCommandsRequestDTO,
    ): CancelablePromise<Array<SlashCommandDTO>> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/bots/{clientId}/commands',
            path: {
                clientId: clientId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Upload bot profile picture (owner only)
     * @param clientId
     * @param formData
     * @returns BotUploadPictureResponseDTO
     * @throws ApiError
     */
    public static botControllerUploadProfilePicture(
        clientId: string,
        formData: {
            profilePicture?: Blob;
        },
    ): CancelablePromise<BotUploadPictureResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/bots/{clientId}/picture',
            path: {
                clientId: clientId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Upload bot profile banner (owner only)
     * @param clientId
     * @param formData
     * @returns BotUploadBannerResponseDTO
     * @throws ApiError
     */
    public static botControllerUploadBanner(
        clientId: string,
        formData: {
            banner?: Blob;
        },
    ): CancelablePromise<BotUploadBannerResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/bots/{clientId}/banner',
            path: {
                clientId: clientId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
}
