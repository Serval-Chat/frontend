/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { SetCommandsRequestDTO } from '../models/SetCommandsRequestDTO';
import type { SlashCommandDTO } from '../models/SlashCommandDTO';

export class ApplicationsService {
    /**
     * Get slash commands registered by this bot
     * @returns SlashCommandDTO
     * @throws ApiError
     */
    public static applicationControllerGetMyCommands(): CancelablePromise<
        Array<SlashCommandDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/applications/@me/commands',
        });
    }
    /**
     * Bulk-overwrite slash commands for this bot (token auth)
     * @param requestBody
     * @returns SlashCommandDTO
     * @throws ApiError
     */
    public static applicationControllerSetMyCommands(
        requestBody: SetCommandsRequestDTO,
    ): CancelablePromise<Array<SlashCommandDTO>> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/applications/@me/commands',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
}
