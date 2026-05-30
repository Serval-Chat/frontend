/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { BotInteractionRespondDTO } from '../models/BotInteractionRespondDTO';
import type { CreateInteractionRequestDTO } from '../models/CreateInteractionRequestDTO';
import type { InteractionSuccessResponseDTO } from '../models/InteractionSuccessResponseDTO';

export class InteractionsService {
    /**
     * Get available commands for a server
     * @param serverId
     * @returns any Array of slash commands
     * @throws ApiError
     */
    public static interactionControllerGetServerCommands(
        serverId: string,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/commands',
            path: {
                serverId: serverId,
            },
        });
    }
    /**
     * Trigger a slash command interaction
     * @param requestBody
     * @returns InteractionSuccessResponseDTO
     * @throws ApiError
     */
    public static interactionControllerCreateInteraction(
        requestBody: CreateInteractionRequestDTO,
    ): CancelablePromise<InteractionSuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/interactions',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Send an optionally ephemeral bot interaction response
     * @param requestBody
     * @returns InteractionSuccessResponseDTO
     * @throws ApiError
     */
    public static interactionControllerRespondToInteraction(
        requestBody: BotInteractionRespondDTO,
    ): CancelablePromise<InteractionSuccessResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/interactions/respond',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
