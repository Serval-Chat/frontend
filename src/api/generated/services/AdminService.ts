/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { AdminBanHistoryItemDTO } from '../models/AdminBanHistoryItemDTO';
import type { AdminBanUserRequestDTO } from '../models/AdminBanUserRequestDTO';
import type { AdminBanUserResponseDTO } from '../models/AdminBanUserResponseDTO';
import type { AdminBansDiagnosticResponseDTO } from '../models/AdminBansDiagnosticResponseDTO';
import type { AdminDeleteServerResponseDTO } from '../models/AdminDeleteServerResponseDTO';
import type { AdminDeleteUserResponseDTO } from '../models/AdminDeleteUserResponseDTO';
import type { AdminExtendedUserDetailsDTO } from '../models/AdminExtendedUserDetailsDTO';
import type { AdminHardDeleteUserResponseDTO } from '../models/AdminHardDeleteUserResponseDTO';
import type { AdminMuteUserRequestDTO } from '../models/AdminMuteUserRequestDTO';
import type { AdminMuteUserResponseDTO } from '../models/AdminMuteUserResponseDTO';
import type { AdminNoteResponseDTO } from '../models/AdminNoteResponseDTO';
import type { AdminResetProfileRequestDTO } from '../models/AdminResetProfileRequestDTO';
import type { AdminResetProfileResponseDTO } from '../models/AdminResetProfileResponseDTO';
import type { AdminRestoreServerResponseDTO } from '../models/AdminRestoreServerResponseDTO';
import type { AdminServerDetailsDTO } from '../models/AdminServerDetailsDTO';
import type { AdminServerListItemDTO } from '../models/AdminServerListItemDTO';
import type { AdminServerVerificationOverrideRequestDTO } from '../models/AdminServerVerificationOverrideRequestDTO';
import type { AdminServerVerificationOverrideResponseDTO } from '../models/AdminServerVerificationOverrideResponseDTO';
import type { AdminServerVerificationStatsDTO } from '../models/AdminServerVerificationStatsDTO';
import type { AdminServerVerifyResponseDTO } from '../models/AdminServerVerifyResponseDTO';
import type { AdminSimpleMessageResponseDTO } from '../models/AdminSimpleMessageResponseDTO';
import type { AdminSoftDeleteUserRequestDTO } from '../models/AdminSoftDeleteUserRequestDTO';
import type { AdminSoftDeleteUserResponseDTO } from '../models/AdminSoftDeleteUserResponseDTO';
import type { AdminUnbanUserResponseDTO } from '../models/AdminUnbanUserResponseDTO';
import type { AdminUnmuteUserResponseDTO } from '../models/AdminUnmuteUserResponseDTO';
import type { AdminUpdateUserPermissionsRequestDTO } from '../models/AdminUpdateUserPermissionsRequestDTO';
import type { AdminUpdateUserPermissionsResponseDTO } from '../models/AdminUpdateUserPermissionsResponseDTO';
import type { AdminUserDetailsDTO } from '../models/AdminUserDetailsDTO';
import type { AdminUserListItemDTO } from '../models/AdminUserListItemDTO';
import type { AdminUserShortDTO } from '../models/AdminUserShortDTO';
import type { AdminWarnUserRequestDTO } from '../models/AdminWarnUserRequestDTO';
import type { AdminWarnUserResponseDTO } from '../models/AdminWarnUserResponseDTO';
import type { BadgeResponseDTO } from '../models/BadgeResponseDTO';
import type { BadgeUserActionResponseDTO } from '../models/BadgeUserActionResponseDTO';
import type { BatchCreateInvitesRequestDTO } from '../models/BatchCreateInvitesRequestDTO';
import type { CreateAdminNoteRequestDTO } from '../models/CreateAdminNoteRequestDTO';
import type { CreateBadgeRequestDTO } from '../models/CreateBadgeRequestDTO';
import type { DashBoardStatsDTO } from '../models/DashBoardStatsDTO';
import type { InviteResponseDTO } from '../models/InviteResponseDTO';
import type { SoftDeleteAdminNoteRequestDTO } from '../models/SoftDeleteAdminNoteRequestDTO';
import type { UpdateAdminNoteRequestDTO } from '../models/UpdateAdminNoteRequestDTO';
import type { UpdateBadgeRequestDTO } from '../models/UpdateBadgeRequestDTO';

export class AdminService {
    /**
     * Retrieve high-level statistics for the admin dashboard
     * @param range
     * @returns DashBoardStatsDTO
     * @throws ApiError
     */
    public static adminControllerGetStats(
        range: string,
    ): CancelablePromise<DashBoardStatsDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/stats',
            query: {
                range: range,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * List users with optional search and filtering
     * @param limit
     * @param offset
     * @param search
     * @param filter
     * @param includeDeleted
     * @returns AdminUserListItemDTO
     * @throws ApiError
     */
    public static adminControllerListUsers(
        limit?: number,
        offset?: number,
        search?: string,
        filter?: 'banned' | 'admin' | 'recent',
        includeDeleted?: boolean,
    ): CancelablePromise<Array<AdminUserListItemDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/users',
            query: {
                limit: limit,
                offset: offset,
                search: search,
                filter: filter,
                includeDeleted: includeDeleted,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * List all administrators (short info)
     * @returns AdminUserShortDTO
     * @throws ApiError
     */
    public static adminControllerListAdmins(): CancelablePromise<
        Array<AdminUserShortDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/users/admins',
        });
    }
    /**
     * Retrieve detailed information about a specific user
     * @param userId
     * @returns AdminUserDetailsDTO
     * @throws ApiError
     */
    public static adminControllerGetUserDetails(
        userId: string,
    ): CancelablePromise<AdminUserDetailsDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/users/{userId}',
            path: {
                userId: userId,
            },
            errors: {
                403: `Forbidden`,
                404: `User not found`,
            },
        });
    }
    /**
     * Legacy delete endpoint that forwards to soft delete
     * @param userId
     * @param requestBody
     * @returns AdminDeleteUserResponseDTO
     * @throws ApiError
     */
    public static adminControllerDeleteUser(
        userId: string,
        requestBody: AdminSoftDeleteUserRequestDTO,
    ): CancelablePromise<AdminDeleteUserResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/admin/users/{userId}',
            path: {
                userId: userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `User not found`,
            },
        });
    }
    /**
     * Reset specific profile fields for a user
     * @param userId
     * @param requestBody
     * @returns AdminResetProfileResponseDTO
     * @throws ApiError
     */
    public static adminControllerResetUserProfile(
        userId: string,
        requestBody: AdminResetProfileRequestDTO,
    ): CancelablePromise<AdminResetProfileResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/users/{userId}/reset',
            path: {
                userId: userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid fields`,
                403: `Forbidden`,
                404: `User not found`,
            },
        });
    }
    /**
     * Soft deletes a user account
     * @param userId
     * @param requestBody
     * @returns AdminSoftDeleteUserResponseDTO
     * @throws ApiError
     */
    public static adminControllerSoftDeleteUser(
        userId: string,
        requestBody: AdminSoftDeleteUserRequestDTO,
    ): CancelablePromise<AdminSoftDeleteUserResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/users/{userId}/soft-delete',
            path: {
                userId: userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `User already deleted`,
                403: `Forbidden`,
                404: `User not found`,
            },
        });
    }
    /**
     * Hard deletes a user account completely
     * @param userId
     * @param requestBody
     * @returns AdminHardDeleteUserResponseDTO
     * @throws ApiError
     */
    public static adminControllerHardDeleteUser(
        userId: string,
        requestBody: AdminSoftDeleteUserRequestDTO,
    ): CancelablePromise<AdminHardDeleteUserResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/users/{userId}/hard-delete',
            path: {
                userId: userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `User not found`,
            },
        });
    }
    /**
     * Update a user's permissions
     * @param userId
     * @param requestBody
     * @returns AdminUpdateUserPermissionsResponseDTO
     * @throws ApiError
     */
    public static adminControllerUpdateUserPermissions(
        userId: string,
        requestBody: AdminUpdateUserPermissionsRequestDTO,
    ): CancelablePromise<AdminUpdateUserPermissionsResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/admin/users/{userId}/permissions',
            path: {
                userId: userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid permissions`,
                403: `Forbidden`,
                404: `User not found`,
            },
        });
    }
    /**
     * Ban a user for a specified duration
     * @param userId
     * @param requestBody
     * @returns AdminBanUserResponseDTO
     * @throws ApiError
     */
    public static adminControllerBanUser(
        userId: string,
        requestBody: AdminBanUserRequestDTO,
    ): CancelablePromise<AdminBanUserResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/users/{userId}/ban',
            path: {
                userId: userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `User not found`,
            },
        });
    }
    /**
     * Unban a user
     * @param userId
     * @returns AdminUnbanUserResponseDTO
     * @throws ApiError
     */
    public static adminControllerUnbanUser(
        userId: string,
    ): CancelablePromise<AdminUnbanUserResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/users/{userId}/unban',
            path: {
                userId: userId,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Retrieve ban history for a user
     * @param userId
     * @returns AdminBanHistoryItemDTO
     * @throws ApiError
     */
    public static adminControllerGetUserBanHistory(
        userId: string,
    ): CancelablePromise<Array<AdminBanHistoryItemDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/users/{userId}/bans',
            path: {
                userId: userId,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * List all bans with pagination
     * @param limit
     * @param offset
     * @returns any
     * @throws ApiError
     */
    public static adminControllerListBans(
        limit: number,
        offset: number,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/bans',
            query: {
                limit: limit,
                offset: offset,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Diagnostic endpoint for ban collections
     * @returns AdminBansDiagnosticResponseDTO
     * @throws ApiError
     */
    public static adminControllerGetBansDiagnostic(): CancelablePromise<AdminBansDiagnosticResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/bans/diagnostic',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Mute a user globally
     * @param userId
     * @param requestBody
     * @returns AdminMuteUserResponseDTO
     * @throws ApiError
     */
    public static adminControllerMuteUser(
        userId: string,
        requestBody: AdminMuteUserRequestDTO,
    ): CancelablePromise<AdminMuteUserResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/users/{userId}/mute',
            path: {
                userId: userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `User not found`,
            },
        });
    }
    /**
     * Unmute a user globally
     * @param userId
     * @returns AdminUnmuteUserResponseDTO
     * @throws ApiError
     */
    public static adminControllerUnmuteUser(
        userId: string,
    ): CancelablePromise<AdminUnmuteUserResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/users/{userId}/unmute',
            path: {
                userId: userId,
            },
        });
    }
    /**
     * Retrieve mute history for a user
     * @param userId
     * @returns AdminBanHistoryItemDTO
     * @throws ApiError
     */
    public static adminControllerGetUserMuteHistory(
        userId: string,
    ): CancelablePromise<Array<AdminBanHistoryItemDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/users/{userId}/mutes',
            path: {
                userId: userId,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * List all mutes with pagination
     * @param limit
     * @param offset
     * @returns any
     * @throws ApiError
     */
    public static adminControllerListMutes(
        limit: number,
        offset: number,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/mutes',
            query: {
                limit: limit,
                offset: offset,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Warn a user
     * @param userId
     * @param requestBody
     * @returns AdminWarnUserResponseDTO
     * @throws ApiError
     */
    public static adminControllerWarnUser(
        userId: string,
        requestBody: AdminWarnUserRequestDTO,
    ): CancelablePromise<AdminWarnUserResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/users/{userId}/warn',
            path: {
                userId: userId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Retrieve warnings for a user
     * @param userId
     * @returns AdminWarnUserResponseDTO
     * @throws ApiError
     */
    public static adminControllerGetUserWarnings(
        userId: string,
    ): CancelablePromise<Array<AdminWarnUserResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/users/{userId}/warnings',
            path: {
                userId: userId,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * List all warnings with pagination
     * @param limit
     * @param offset
     * @returns any
     * @throws ApiError
     */
    public static adminControllerListWarnings(
        limit: number,
        offset: number,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/warnings',
            query: {
                limit: limit,
                offset: offset,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * List audit logs with pagination
     * @param limit
     * @param offset
     * @param actorId
     * @param actionType
     * @param targetUserId
     * @param startDate
     * @param endDate
     * @returns any
     * @throws ApiError
     */
    public static adminControllerListAuditLogs(
        limit?: number,
        offset?: number,
        actorId?: string,
        actionType?: string,
        targetUserId?: string,
        startDate?: string,
        endDate?: string,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/logs',
            query: {
                limit: limit,
                offset: offset,
                actorId: actorId,
                actionType: actionType,
                targetUserId: targetUserId,
                startDate: startDate,
                endDate: endDate,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * List servers with owner details
     * @param limit
     * @param offset
     * @param search
     * @returns AdminServerListItemDTO
     * @throws ApiError
     */
    public static adminControllerListServers(
        limit: number,
        offset: number,
        search: string,
    ): CancelablePromise<Array<AdminServerListItemDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/servers',
            query: {
                limit: limit,
                offset: offset,
                search: search,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get server verification scoring stats
     * @returns AdminServerVerificationStatsDTO
     * @throws ApiError
     */
    public static adminControllerGetServerVerificationStats(): CancelablePromise<AdminServerVerificationStatsDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/servers/verification',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Recompute server verification scores now
     * @returns AdminServerVerificationStatsDTO
     * @throws ApiError
     */
    public static adminControllerRunServerVerificationNow(): CancelablePromise<AdminServerVerificationStatsDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/servers/verification/run',
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Soft deletes a server
     * @param serverId
     * @returns AdminDeleteServerResponseDTO
     * @throws ApiError
     */
    public static adminControllerDeleteServer(
        serverId: string,
    ): CancelablePromise<AdminDeleteServerResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/admin/servers/{serverId}',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
                404: `Server not found`,
            },
        });
    }
    /**
     * Retrieve detailed information about a specific server
     * @param serverId
     * @returns AdminServerDetailsDTO
     * @throws ApiError
     */
    public static adminControllerGetServerDetails(
        serverId: string,
    ): CancelablePromise<AdminServerDetailsDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/servers/{serverId}',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
                404: `Server not found`,
            },
        });
    }
    /**
     * Restore a deleted server
     * @param serverId
     * @returns AdminRestoreServerResponseDTO
     * @throws ApiError
     */
    public static adminControllerRestoreServer(
        serverId: string,
    ): CancelablePromise<AdminRestoreServerResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/servers/{serverId}/restore',
            path: {
                serverId: serverId,
            },
            errors: {
                400: `Server not deleted`,
                403: `Forbidden`,
                404: `Server not found`,
            },
        });
    }
    /**
     * Retrieve extended user details including servers
     * @param userId
     * @returns AdminExtendedUserDetailsDTO
     * @throws ApiError
     */
    public static adminControllerGetExtendedUserDetails(
        userId: string,
    ): CancelablePromise<AdminExtendedUserDetailsDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/users/{userId}/details',
            path: {
                userId: userId,
            },
            errors: {
                403: `Forbidden`,
                404: `User not found`,
            },
        });
    }
    /**
     * List servers awaiting verification review
     * @param limit
     * @param offset
     * @returns AdminServerListItemDTO
     * @throws ApiError
     */
    public static adminControllerListAwaitingReviewServers(
        limit: number,
        offset: number,
    ): CancelablePromise<Array<AdminServerListItemDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/servers/awaiting-review',
            query: {
                limit: limit,
                offset: offset,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * List all invites for a server (Admin access)
     * @param serverId
     * @returns any
     * @throws ApiError
     */
    public static adminControllerGetServerInvites(
        serverId: string,
    ): CancelablePromise<Array<Record<string, any>>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/servers/{serverId}/invites',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
                404: `Server not found`,
            },
        });
    }
    /**
     * Delete a server invite (Admin access)
     * @param serverId
     * @param inviteId
     * @returns AdminSimpleMessageResponseDTO Invite deleted
     * @throws ApiError
     */
    public static adminControllerDeleteServerInvite(
        serverId: string,
        inviteId: string,
    ): CancelablePromise<AdminSimpleMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/admin/servers/{serverId}/invites/{inviteId}',
            path: {
                serverId: serverId,
                inviteId: inviteId,
            },
            errors: {
                403: `Forbidden`,
                404: `Invite not found`,
            },
        });
    }
    /**
     * Decline server verification application
     * @param serverId
     * @returns AdminSimpleMessageResponseDTO Verification declined
     * @throws ApiError
     */
    public static adminControllerDeclineVerification(
        serverId: string,
    ): CancelablePromise<AdminSimpleMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/admin/servers/{serverId}/verification',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
                404: `Server not found`,
            },
        });
    }
    /**
     * Set or clear a manual server verification override
     * @param serverId
     * @param requestBody
     * @returns AdminServerVerificationOverrideResponseDTO
     * @throws ApiError
     */
    public static adminControllerSetServerVerificationOverride(
        serverId: string,
        requestBody: AdminServerVerificationOverrideRequestDTO,
    ): CancelablePromise<AdminServerVerificationOverrideResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/admin/servers/{serverId}/verification-override',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `Server not found`,
            },
        });
    }
    /**
     * Grant a server the verified badge
     * @param serverId
     * @returns AdminServerVerifyResponseDTO
     * @throws ApiError
     */
    public static adminControllerVerifyServer(
        serverId: string,
    ): CancelablePromise<AdminServerVerifyResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/servers/{serverId}/verify',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
                404: `Server not found`,
            },
        });
    }
    /**
     * Remove the verified badge from a server
     * @param serverId
     * @returns AdminServerVerifyResponseDTO
     * @throws ApiError
     */
    public static adminControllerUnverifyServer(
        serverId: string,
    ): CancelablePromise<AdminServerVerifyResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/admin/servers/{serverId}/verify',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
                404: `Server not found`,
            },
        });
    }
    /**
     * Get all notes for a specific server
     * @param serverId
     * @returns AdminNoteResponseDTO
     * @throws ApiError
     */
    public static adminControllerGetServerNotes(
        serverId: string,
    ): CancelablePromise<Array<AdminNoteResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/servers/{serverId}/notes',
            path: {
                serverId: serverId,
            },
        });
    }
    /**
     * Create a new note for a server
     * @param serverId
     * @param requestBody
     * @returns AdminNoteResponseDTO
     * @throws ApiError
     */
    public static adminControllerCreateServerNote(
        serverId: string,
        requestBody: CreateAdminNoteRequestDTO,
    ): CancelablePromise<AdminNoteResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/servers/{serverId}/notes',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get all notes for a specific user
     * @param userId
     * @returns AdminNoteResponseDTO
     * @throws ApiError
     */
    public static adminControllerGetUserNotes(
        userId: string,
    ): CancelablePromise<Array<AdminNoteResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/users/{userId}/notes',
            path: {
                userId: userId,
            },
        });
    }
    /**
     * Create a new note for a user
     * @param userId
     * @param requestBody
     * @returns AdminNoteResponseDTO
     * @throws ApiError
     */
    public static adminControllerCreateUserNote(
        userId: string,
        requestBody: CreateAdminNoteRequestDTO,
    ): CancelablePromise<AdminNoteResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/users/{userId}/notes',
            path: {
                userId: userId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update an existing admin note
     * @param noteId
     * @param requestBody
     * @returns AdminNoteResponseDTO
     * @throws ApiError
     */
    public static adminControllerUpdateNote(
        noteId: string,
        requestBody: UpdateAdminNoteRequestDTO,
    ): CancelablePromise<AdminNoteResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/admin/notes/{noteId}',
            path: {
                noteId: noteId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Soft-delete a note with a reason
     * @param noteId
     * @param requestBody
     * @returns AdminNoteResponseDTO
     * @throws ApiError
     */
    public static adminControllerDeleteNote(
        noteId: string,
        requestBody: SoftDeleteAdminNoteRequestDTO,
    ): CancelablePromise<AdminNoteResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/admin/notes/{noteId}',
            path: {
                noteId: noteId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Retrieve all available badges
     * @returns BadgeResponseDTO
     * @throws ApiError
     */
    public static adminBadgeControllerGetBadges(): CancelablePromise<
        Array<BadgeResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/badges',
        });
    }
    /**
     * Create a new badge
     * @param requestBody
     * @returns BadgeResponseDTO
     * @throws ApiError
     */
    public static adminBadgeControllerCreateBadge(
        requestBody: CreateBadgeRequestDTO,
    ): CancelablePromise<BadgeResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/badges',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `Badge ID already exists`,
            },
        });
    }
    /**
     * Update a badge
     * @param badgeId
     * @param requestBody
     * @returns BadgeResponseDTO
     * @throws ApiError
     */
    public static adminBadgeControllerUpdateBadge(
        badgeId: string,
        requestBody: UpdateBadgeRequestDTO,
    ): CancelablePromise<BadgeResponseDTO> {
        return __request(OpenAPI, {
            method: 'PUT',
            url: '/api/v1/admin/badges/{badgeId}',
            path: {
                badgeId: badgeId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                404: `Badge not found`,
            },
        });
    }
    /**
     * Delete a badge
     * @param badgeId
     * @returns AdminSimpleMessageResponseDTO Badge deleted successfully
     * @throws ApiError
     */
    public static adminBadgeControllerDeleteBadge(
        badgeId: string,
    ): CancelablePromise<AdminSimpleMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/admin/badges/{badgeId}',
            path: {
                badgeId: badgeId,
            },
            errors: {
                404: `Badge not found`,
            },
        });
    }
    /**
     * Get user's badges
     * @param userId
     * @returns BadgeResponseDTO
     * @throws ApiError
     */
    public static adminBadgeControllerGetUserBadges(
        userId: string,
    ): CancelablePromise<Array<BadgeResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/users/{userId}/badges',
            path: {
                userId: userId,
            },
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Add badge to user
     * @param userId
     * @returns BadgeUserActionResponseDTO Badge added successfully
     * @throws ApiError
     */
    public static adminBadgeControllerAddBadgeToUser(
        userId: string,
    ): CancelablePromise<BadgeUserActionResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/users/{userId}/badges',
            path: {
                userId: userId,
            },
            errors: {
                404: `User or Badge not found`,
                409: `User already has this badge`,
            },
        });
    }
    /**
     * Remove badge from user
     * @param userId
     * @param badgeId
     * @returns BadgeUserActionResponseDTO Badge removed successfully
     * @throws ApiError
     */
    public static adminBadgeControllerRemoveBadgeFromUser(
        userId: string,
        badgeId: string,
    ): CancelablePromise<BadgeUserActionResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/admin/users/{userId}/badges/{badgeId}',
            path: {
                userId: userId,
                badgeId: badgeId,
            },
            errors: {
                404: `User not found or badge not assigned`,
            },
        });
    }
    /**
     * Lists all active invite tokens
     * @returns string
     * @throws ApiError
     */
    public static adminInviteControllerListInvites(): CancelablePromise<
        Array<string>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/invites',
        });
    }
    /**
     * Generates a new random invite token
     * @returns InviteResponseDTO
     * @throws ApiError
     */
    public static adminInviteControllerCreateInvite(): CancelablePromise<InviteResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/invites',
        });
    }
    /**
     * Deletes a specific invite token
     * @param token
     * @returns AdminSimpleMessageResponseDTO Invite deleted
     * @throws ApiError
     */
    public static adminInviteControllerDeleteInvite(
        token: string,
    ): CancelablePromise<AdminSimpleMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/admin/invites/{token}',
            path: {
                token: token,
            },
            errors: {
                404: `Token not found`,
            },
        });
    }
    /**
     * Batch generates new random invite tokens
     * @param requestBody
     * @returns InviteResponseDTO
     * @throws ApiError
     */
    public static adminInviteControllerBatchCreateInvites(
        requestBody: BatchCreateInvitesRequestDTO,
    ): CancelablePromise<InviteResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/admin/invites/batch',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Exports all active invite tokens as a file
     * @returns string File download
     * @throws ApiError
     */
    public static adminInviteControllerExportInvites(): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/admin/invites/export',
            errors: {
                404: `No tokens found`,
            },
        });
    }
}
