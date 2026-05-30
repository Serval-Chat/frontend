/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { CreateServerRequestDTO } from '../models/CreateServerRequestDTO';
import type { EmojiResponseDTO } from '../models/EmojiResponseDTO';
import type { OnboardingSettingsResponseDTO } from '../models/OnboardingSettingsResponseDTO';
import type { ServerCreateResponseDTO } from '../models/ServerCreateResponseDTO';
import type { ServerDeleteResponseDTO } from '../models/ServerDeleteResponseDTO';
import type { ServerDiscoveryStatusDTO } from '../models/ServerDiscoveryStatusDTO';
import type { ServerMarkReadResponseDTO } from '../models/ServerMarkReadResponseDTO';
import type { ServerOnboardingSettingsRequestDTO } from '../models/ServerOnboardingSettingsRequestDTO';
import type { ServerResponseDTO } from '../models/ServerResponseDTO';
import type { ServerStatsResponseDTO } from '../models/ServerStatsResponseDTO';
import type { ServerUnreadStatusResponseDTO } from '../models/ServerUnreadStatusResponseDTO';
import type { ServerVerificationResponseDTO } from '../models/ServerVerificationResponseDTO';
import type { SetDefaultRoleRequestDTO } from '../models/SetDefaultRoleRequestDTO';
import type { SetDefaultRoleResponseDTO } from '../models/SetDefaultRoleResponseDTO';
import type { UpdateDefaultRoleRequestDTO } from '../models/UpdateDefaultRoleRequestDTO';
import type { UpdateServerRequestDTO } from '../models/UpdateServerRequestDTO';
import type { UploadBannerResponseDTO } from '../models/UploadBannerResponseDTO';
import type { UploadIconResponseDTO } from '../models/UploadIconResponseDTO';
import type { VoiceStatesResponseDTO } from '../models/VoiceStatesResponseDTO';

export class ServersService {
    /**
     * Get current voice states
     * @param serverId
     * @returns VoiceStatesResponseDTO Voice states map
     * @throws ApiError
     */
    public static serverControllerGetVoiceStates(
        serverId: string,
    ): CancelablePromise<VoiceStatesResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/voice-states',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get user servers
     * @returns ServerResponseDTO
     * @throws ApiError
     */
    public static serverControllerGetServers(): CancelablePromise<
        Array<ServerResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers',
        });
    }
    /**
     * Create server
     * @param requestBody
     * @returns ServerCreateResponseDTO Server created
     * @throws ApiError
     */
    public static serverControllerCreateServer(
        requestBody: CreateServerRequestDTO,
    ): CancelablePromise<ServerCreateResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid name`,
            },
        });
    }
    /**
     * Get unread status
     * @returns ServerUnreadStatusResponseDTO Unread status per server
     * @throws ApiError
     */
    public static serverControllerGetUnreadStatus(): CancelablePromise<ServerUnreadStatusResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/unread',
        });
    }
    /**
     * Get all emojis from all joined servers
     * @returns EmojiResponseDTO Aggregate list of server emojis
     * @throws ApiError
     */
    public static serverControllerGetAllServerEmojis(): CancelablePromise<
        Array<EmojiResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/emojis',
        });
    }
    /**
     * Mark server as read
     * @param serverId
     * @returns ServerMarkReadResponseDTO Server marked as read
     * @throws ApiError
     */
    public static serverControllerMarkServerAsRead(
        serverId: string,
    ): CancelablePromise<ServerMarkReadResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/ack',
            path: {
                serverId: serverId,
            },
            errors: {
                400: `Invalid ID`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Get server onboarding settings
     * @param serverId
     * @returns OnboardingSettingsResponseDTO Onboarding settings retrieved
     * @throws ApiError
     */
    public static serverControllerGetOnboardingSettings(
        serverId: string,
    ): CancelablePromise<OnboardingSettingsResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/onboarding-settings',
            path: {
                serverId: serverId,
            },
        });
    }
    /**
     * Update server onboarding settings
     * @param serverId
     * @param requestBody
     * @returns OnboardingSettingsResponseDTO Onboarding settings updated
     * @throws ApiError
     */
    public static serverControllerUpdateOnboardingSettings(
        serverId: string,
        requestBody: ServerOnboardingSettingsRequestDTO,
    ): CancelablePromise<OnboardingSettingsResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}/onboarding-settings',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get server details
     * @param serverId
     * @returns ServerResponseDTO
     * @throws ApiError
     */
    public static serverControllerGetServerDetails(
        serverId: string,
    ): CancelablePromise<ServerResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
                404: `Server Not Found`,
            },
        });
    }
    /**
     * Update server
     * @param serverId
     * @param requestBody
     * @returns ServerResponseDTO
     * @throws ApiError
     */
    public static serverControllerUpdateServer(
        serverId: string,
        requestBody: UpdateServerRequestDTO,
    ): CancelablePromise<ServerResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `Forbidden`,
                404: `Server Not Found`,
            },
        });
    }
    /**
     * Delete server
     * @param serverId
     * @returns ServerDeleteResponseDTO Server deleted
     * @throws ApiError
     */
    public static serverControllerDeleteServer(
        serverId: string,
    ): CancelablePromise<ServerDeleteResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
                404: `Server Not Found`,
            },
        });
    }
    /**
     * Get server stats
     * @param serverId
     * @returns ServerStatsResponseDTO
     * @throws ApiError
     */
    public static serverControllerGetServerStats(
        serverId: string,
    ): CancelablePromise<ServerStatsResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/stats',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
                404: `Server Not Found`,
            },
        });
    }
    /**
     * Get server discovery eligibility status
     * @param serverId
     * @returns ServerDiscoveryStatusDTO
     * @throws ApiError
     */
    public static serverControllerGetDiscoveryStatus(
        serverId: string,
    ): CancelablePromise<ServerDiscoveryStatusDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/discovery-status',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
                404: `Server Not Found`,
            },
        });
    }
    /**
     * Set default role
     * @param serverId
     * @param requestBody
     * @returns SetDefaultRoleResponseDTO
     * @throws ApiError
     */
    public static serverControllerSetDefaultRole(
        serverId: string,
        requestBody: SetDefaultRoleRequestDTO,
    ): CancelablePromise<SetDefaultRoleResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/roles/default',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Server or role not found`,
            },
        });
    }
    /**
     * Apply for server verification
     * @param serverId
     * @returns ServerVerificationResponseDTO Verification requested
     * @throws ApiError
     */
    public static serverControllerRequestVerification(
        serverId: string,
    ): CancelablePromise<ServerVerificationResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/verification-request',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Forbidden`,
                404: `Server Not Found`,
            },
        });
    }
    /**
     * Upload server icon
     * @param serverId
     * @param formData
     * @returns UploadIconResponseDTO
     * @throws ApiError
     */
    public static serverControllerUploadServerIcon(
        serverId: string,
        formData: {
            icon?: Blob;
        },
    ): CancelablePromise<UploadIconResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/icon',
            path: {
                serverId: serverId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Upload server banner
     * @param serverId
     * @param formData
     * @returns UploadBannerResponseDTO
     * @throws ApiError
     */
    public static serverControllerUploadServerBanner(
        serverId: string,
        formData: {
            banner?: Blob;
        },
    ): CancelablePromise<UploadBannerResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/banner',
            path: {
                serverId: serverId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
            },
        });
    }
    /**
     * Update server default role
     * @param serverId
     * @param requestBody
     * @returns SetDefaultRoleResponseDTO
     * @throws ApiError
     */
    public static serverControllerUpdateDefaultRole(
        serverId: string,
        requestBody: UpdateDefaultRoleRequestDTO,
    ): CancelablePromise<SetDefaultRoleResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}/default-role',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Bad Request`,
                403: `Forbidden`,
                404: `Server or role not found`,
            },
        });
    }
}
