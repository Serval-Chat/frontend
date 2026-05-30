/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { BanMemberRequestDTO } from '../models/BanMemberRequestDTO';
import type { ChannelPreferencesRequestDTO } from '../models/ChannelPreferencesRequestDTO';
import type { KickMemberRequestDTO } from '../models/KickMemberRequestDTO';
import type { MemberActionResponseDTO } from '../models/MemberActionResponseDTO';
import type { OnboardingStateResponseDTO } from '../models/OnboardingStateResponseDTO';
import type { SelfRolesRequestDTO } from '../models/SelfRolesRequestDTO';
import type { ServerBanResponseDTO } from '../models/ServerBanResponseDTO';
import type { ServerMemberListResponseDTO } from '../models/ServerMemberListResponseDTO';
import type { ServerMemberResponseDTO } from '../models/ServerMemberResponseDTO';
import type { ServerMemberSearchResponseDTO } from '../models/ServerMemberSearchResponseDTO';
import type { ServerMemberWithUserResponseDTO } from '../models/ServerMemberWithUserResponseDTO';
import type { TimeoutMemberRequestDTO } from '../models/TimeoutMemberRequestDTO';
import type { TimeoutResponseDTO } from '../models/TimeoutResponseDTO';
import type { TransferOwnershipRequestDTO } from '../models/TransferOwnershipRequestDTO';
import type { TransferOwnershipResponseDTO } from '../models/TransferOwnershipResponseDTO';

export class ServerMembersService {
    /**
     * Get current member onboarding state
     * @param serverId
     * @returns OnboardingStateResponseDTO Onboarding state retrieved
     * @throws ApiError
     */
    public static serverMemberControllerGetOnboarding(
        serverId: string,
    ): CancelablePromise<OnboardingStateResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/onboarding',
            path: {
                serverId: serverId,
            },
        });
    }
    /**
     * Accept server onboarding rules
     * @param serverId
     * @returns ServerMemberResponseDTO Rules accepted
     * @throws ApiError
     */
    public static serverMemberControllerAcceptOnboardingRules(
        serverId: string,
    ): CancelablePromise<ServerMemberResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/onboarding/accept-rules',
            path: {
                serverId: serverId,
            },
        });
    }
    /**
     * Update current member self-assignable roles
     * @param serverId
     * @param requestBody
     * @returns ServerMemberResponseDTO Self roles updated
     * @throws ApiError
     */
    public static serverMemberControllerUpdateSelfRoles(
        serverId: string,
        requestBody: SelfRolesRequestDTO,
    ): CancelablePromise<ServerMemberResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}/self-roles',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update current member channel preferences
     * @param serverId
     * @param requestBody
     * @returns ServerMemberResponseDTO Channel preferences updated
     * @throws ApiError
     */
    public static serverMemberControllerUpdateChannelPreferences(
        serverId: string,
        requestBody: ChannelPreferencesRequestDTO,
    ): CancelablePromise<ServerMemberResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}/channel-preferences',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Complete server onboarding
     * @param serverId
     * @returns ServerMemberResponseDTO Onboarding completed
     * @throws ApiError
     */
    public static serverMemberControllerCompleteOnboarding(
        serverId: string,
    ): CancelablePromise<ServerMemberResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/onboarding/complete',
            path: {
                serverId: serverId,
            },
        });
    }
    /**
     * Get all server members
     * @param serverId
     * @returns ServerMemberListResponseDTO Server members retrieved
     * @throws ApiError
     */
    public static serverMemberControllerGetServerMembers(
        serverId: string,
    ): CancelablePromise<ServerMemberListResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/members',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Not a member of this server`,
            },
        });
    }
    /**
     * Search server members
     * @param serverId
     * @param q
     * @returns ServerMemberSearchResponseDTO Search results
     * @throws ApiError
     */
    public static serverMemberControllerSearchMembers(
        serverId: string,
        q: string,
    ): CancelablePromise<ServerMemberSearchResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/members/search',
            path: {
                serverId: serverId,
            },
            query: {
                q: q,
            },
            errors: {
                403: `Not a member of this server`,
            },
        });
    }
    /**
     * Get server member details
     * @param serverId
     * @param userId
     * @returns ServerMemberWithUserResponseDTO Member details retrieved
     * @throws ApiError
     */
    public static serverMemberControllerGetMember(
        serverId: string,
        userId: string,
    ): CancelablePromise<ServerMemberWithUserResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/members/{userId}',
            path: {
                serverId: serverId,
                userId: userId,
            },
            errors: {
                403: `Not a member of this server`,
                404: `Member not found`,
            },
        });
    }
    /**
     * Kick a member from the server
     * @param serverId
     * @param userId
     * @param requestBody
     * @returns MemberActionResponseDTO Member kicked
     * @throws ApiError
     */
    public static serverMemberControllerKickMember(
        serverId: string,
        userId: string,
        requestBody: KickMemberRequestDTO,
    ): CancelablePromise<MemberActionResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/members/{userId}',
            path: {
                serverId: serverId,
                userId: userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `No permission to kick members`,
                404: `Member not found`,
            },
        });
    }
    /**
     * Leave the server
     * @param serverId
     * @returns MemberActionResponseDTO Left server
     * @throws ApiError
     */
    public static serverMemberControllerLeaveServer(
        serverId: string,
    ): CancelablePromise<MemberActionResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/members/me',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Owner cannot leave the server`,
            },
        });
    }
    /**
     * Ban a member from the server
     * @param serverId
     * @param requestBody
     * @returns MemberActionResponseDTO Member banned
     * @throws ApiError
     */
    public static serverMemberControllerBanMember(
        serverId: string,
        requestBody: BanMemberRequestDTO,
    ): CancelablePromise<MemberActionResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/bans',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `No permission to ban members`,
            },
        });
    }
    /**
     * Get all server bans
     * @param serverId
     * @returns ServerBanResponseDTO Server bans retrieved
     * @throws ApiError
     */
    public static serverMemberControllerGetBans(
        serverId: string,
    ): CancelablePromise<Array<ServerBanResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/bans',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `No permission to view bans`,
            },
        });
    }
    /**
     * Timeout a member
     * @param serverId
     * @param userId
     * @param requestBody
     * @returns TimeoutResponseDTO Member timed out
     * @throws ApiError
     */
    public static serverMemberControllerTimeoutMember(
        serverId: string,
        userId: string,
        requestBody: TimeoutMemberRequestDTO,
    ): CancelablePromise<TimeoutResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/members/{userId}/timeout',
            path: {
                serverId: serverId,
                userId: userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `No permission to manage roles`,
            },
        });
    }
    /**
     * Unban a user from the server
     * @param serverId
     * @param userId
     * @returns MemberActionResponseDTO Member unbanned
     * @throws ApiError
     */
    public static serverMemberControllerUnbanMember(
        serverId: string,
        userId: string,
    ): CancelablePromise<MemberActionResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/bans/{userId}',
            path: {
                serverId: serverId,
                userId: userId,
            },
            errors: {
                403: `No permission to unban members`,
            },
        });
    }
    /**
     * Add a role to a member
     * @param serverId
     * @param userId
     * @param roleId
     * @returns ServerMemberResponseDTO Role added
     * @throws ApiError
     */
    public static serverMemberControllerAddMemberRole(
        serverId: string,
        userId: string,
        roleId: string,
    ): CancelablePromise<ServerMemberResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/members/{userId}/roles/{roleId}',
            path: {
                serverId: serverId,
                userId: userId,
                roleId: roleId,
            },
            errors: {
                403: `No permission to manage roles`,
                404: `Member not found`,
            },
        });
    }
    /**
     * Remove a role from a member
     * @param serverId
     * @param userId
     * @param roleId
     * @returns ServerMemberResponseDTO Role removed
     * @throws ApiError
     */
    public static serverMemberControllerRemoveMemberRole(
        serverId: string,
        userId: string,
        roleId: string,
    ): CancelablePromise<ServerMemberResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/members/{userId}/roles/{roleId}',
            path: {
                serverId: serverId,
                userId: userId,
                roleId: roleId,
            },
            errors: {
                403: `No permission to manage roles`,
                404: `Member not found`,
            },
        });
    }
    /**
     * Transfer server ownership
     * @param serverId
     * @param requestBody
     * @returns TransferOwnershipResponseDTO Ownership transferred
     * @throws ApiError
     */
    public static serverMemberControllerTransferOwnership(
        serverId: string,
        requestBody: TransferOwnershipRequestDTO,
    ): CancelablePromise<TransferOwnershipResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/transfer-ownership',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Only owner can transfer ownership`,
                404: `Member not found`,
            },
        });
    }
}
