/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { CreateInviteRequestDTO } from '../models/CreateInviteRequestDTO';
import type { InviteDeletedResponseDTO } from '../models/InviteDeletedResponseDTO';
import type { InviteDetailsResponseDTO } from '../models/InviteDetailsResponseDTO';
import type { JoinServerResponseDTO } from '../models/JoinServerResponseDTO';
import type { ServerInviteResponseDTO } from '../models/ServerInviteResponseDTO';

export class ServerInvitesService {
    /**
     * Get all invites for a server
     * @param serverId
     * @returns ServerInviteResponseDTO Server invites retrieved
     * @throws ApiError
     */
    public static serverInviteControllerGetServerInvites(
        serverId: string,
    ): CancelablePromise<Array<ServerInviteResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/invites',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `No permission to manage invites`,
            },
        });
    }
    /**
     * Create a new invite for a server
     * @param serverId
     * @param requestBody
     * @returns ServerInviteResponseDTO Invite created
     * @throws ApiError
     */
    public static serverInviteControllerCreateInvite(
        serverId: string,
        requestBody: CreateInviteRequestDTO,
    ): CancelablePromise<ServerInviteResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/invites',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invite code already exists`,
                403: `Only server owner can create custom invites`,
            },
        });
    }
    /**
     * Delete a server invite
     * @param serverId
     * @param inviteId
     * @returns InviteDeletedResponseDTO Invite deleted
     * @throws ApiError
     */
    public static serverInviteControllerDeleteInvite(
        serverId: string,
        inviteId: string,
    ): CancelablePromise<InviteDeletedResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/invites/{inviteId}',
            path: {
                serverId: serverId,
                inviteId: inviteId,
            },
            errors: {
                403: `No permission to manage invites`,
                404: `Invite not found`,
            },
        });
    }
    /**
     * Get invite details
     * @param code
     * @returns InviteDetailsResponseDTO Invite details retrieved
     * @throws ApiError
     */
    public static serverInviteControllerGetInviteDetails(
        code: string,
    ): CancelablePromise<InviteDetailsResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/invites/{code}',
            path: {
                code: code,
            },
            errors: {
                404: `Invite not found`,
                410: `Invite expired`,
            },
        });
    }
    /**
     * Join a server using an invite code
     * @param code
     * @returns JoinServerResponseDTO Server joined
     * @throws ApiError
     */
    public static serverInviteControllerJoinServer(
        code: string,
    ): CancelablePromise<JoinServerResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/invites/{code}/join',
            path: {
                code: code,
            },
            errors: {
                400: `Already a member of this server`,
                403: `You are banned from this server`,
                404: `Invite not found`,
                410: `Invite expired`,
            },
        });
    }
}
