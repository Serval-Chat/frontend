/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { AssignBadgesRequestDTO } from '../models/AssignBadgesRequestDTO';
import type { BadgeOperationResponseDTO } from '../models/BadgeOperationResponseDTO';
import type { BulkStatusRequestDTO } from '../models/BulkStatusRequestDTO';
import type { BulkStatusesResponseDTO } from '../models/BulkStatusesResponseDTO';
import type { ChangeUsernameRequestDTO } from '../models/ChangeUsernameRequestDTO';
import type { ChangeUsernameResponseDTO } from '../models/ChangeUsernameResponseDTO';
import type { CreateWebsiteConnectionRequestDTO } from '../models/CreateWebsiteConnectionRequestDTO';
import type { CreateWebsiteConnectionResponseDTO } from '../models/CreateWebsiteConnectionResponseDTO';
import type { SimpleMessageResponseDTO } from '../models/SimpleMessageResponseDTO';
import type { UpdateBannerResponseDTO } from '../models/UpdateBannerResponseDTO';
import type { UpdateBioRequestDTO } from '../models/UpdateBioRequestDTO';
import type { UpdateBioResponseDTO } from '../models/UpdateBioResponseDTO';
import type { UpdateCustomStatusResponseDTO } from '../models/UpdateCustomStatusResponseDTO';
import type { UpdateDisplayNameRequestDTO } from '../models/UpdateDisplayNameRequestDTO';
import type { UpdateDisplayNameResponseDTO } from '../models/UpdateDisplayNameResponseDTO';
import type { UpdateLanguageRequestDTO } from '../models/UpdateLanguageRequestDTO';
import type { UpdateLanguageResponseDTO } from '../models/UpdateLanguageResponseDTO';
import type { UpdateProfilePictureResponseDTO } from '../models/UpdateProfilePictureResponseDTO';
import type { UpdatePronounsRequestDTO } from '../models/UpdatePronounsRequestDTO';
import type { UpdatePronounsResponseDTO } from '../models/UpdatePronounsResponseDTO';
import type { UpdateStatusRequestDTO } from '../models/UpdateStatusRequestDTO';
import type { UpdateStyleRequestDTO } from '../models/UpdateStyleRequestDTO';
import type { UpdateStyleResponseDTO } from '../models/UpdateStyleResponseDTO';
import type { UserLookupResponseDTO } from '../models/UserLookupResponseDTO';
import type { UserProfileResponseDTO } from '../models/UserProfileResponseDTO';
import type { VerifyConnectionResponseDTO } from '../models/VerifyConnectionResponseDTO';

export class ProfileService {
    /**
     * Get current user profile
     * @returns UserProfileResponseDTO
     * @throws ApiError
     */
    public static profileControllerGetMyProfile(): CancelablePromise<UserProfileResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/profile/me',
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Create a pending website connection
     * @param requestBody
     * @returns CreateWebsiteConnectionResponseDTO
     * @throws ApiError
     */
    public static profileControllerCreateWebsiteConnection(
        requestBody: CreateWebsiteConnectionRequestDTO,
    ): CancelablePromise<CreateWebsiteConnectionResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/profile/connections/website',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Verify a pending website connection
     * @param connectionId
     * @returns VerifyConnectionResponseDTO Website verified
     * @throws ApiError
     */
    public static profileControllerVerifyWebsiteConnection(
        connectionId: string,
    ): CancelablePromise<VerifyConnectionResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/profile/connections/{connectionId}/verify',
            path: {
                connectionId: connectionId,
            },
        });
    }
    /**
     * Remove a profile connection
     * @param connectionId
     * @returns SimpleMessageResponseDTO Connection removed
     * @throws ApiError
     */
    public static profileControllerRemoveConnection(
        connectionId: string,
    ): CancelablePromise<SimpleMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/profile/connections/{connectionId}',
            path: {
                connectionId: connectionId,
            },
        });
    }
    /**
     * Get user profile by ID
     * @param userId
     * @returns UserProfileResponseDTO
     * @throws ApiError
     */
    public static profileControllerGetUserProfileResponseDto(
        userId: string,
    ): CancelablePromise<UserProfileResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/profile/{userId}',
            path: {
                userId: userId,
            },
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Update user badges
     * @param id
     * @param requestBody
     * @returns BadgeOperationResponseDTO
     * @throws ApiError
     */
    public static profileControllerUpdateUserBadges(
        id: string,
        requestBody: AssignBadgesRequestDTO,
    ): CancelablePromise<BadgeOperationResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/profile/{id}/badges',
            path: {
                id: id,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid badge IDs`,
                403: `Insufficient permissions`,
                404: `User not found`,
            },
        });
    }
    /**
     * Upload profile picture
     * @param formData
     * @returns UpdateProfilePictureResponseDTO
     * @throws ApiError
     */
    public static profileControllerUploadProfilePicture(formData: {
        profilePicture?: Blob;
    }): CancelablePromise<UpdateProfilePictureResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/profile/picture',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Invalid file or dimensions`,
            },
        });
    }
    /**
     * Upload profile banner
     * @param formData
     * @returns UpdateBannerResponseDTO
     * @throws ApiError
     */
    public static profileControllerUploadBanner(formData: {
        banner?: Blob;
    }): CancelablePromise<UpdateBannerResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/profile/banner',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                400: `Invalid file or dimensions`,
            },
        });
    }
    /**
     * Get profile banner
     * @param filename
     * @returns string Banner image
     * @throws ApiError
     */
    public static profileControllerGetBanner(
        filename: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/profile/banner/{filename}',
            path: {
                filename: filename,
            },
            errors: {
                400: `Invalid filename`,
                404: `Banner not found`,
            },
        });
    }
    /**
     * Update bio
     * @param requestBody
     * @returns UpdateBioResponseDTO Bio updated
     * @throws ApiError
     */
    public static profileControllerUpdateBio(
        requestBody: UpdateBioRequestDTO,
    ): CancelablePromise<UpdateBioResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/profile/bio',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update pronouns
     * @param requestBody
     * @returns UpdatePronounsResponseDTO Pronouns updated
     * @throws ApiError
     */
    public static profileControllerUpdatePronouns(
        requestBody: UpdatePronounsRequestDTO,
    ): CancelablePromise<UpdatePronounsResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/profile/pronouns',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update display name
     * @param requestBody
     * @returns UpdateDisplayNameResponseDTO Display name updated
     * @throws ApiError
     */
    public static profileControllerUpdateDisplayName(
        requestBody: UpdateDisplayNameRequestDTO,
    ): CancelablePromise<UpdateDisplayNameResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/profile/display-name',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid display name`,
            },
        });
    }
    /**
     * Update custom status
     * @param requestBody
     * @returns UpdateCustomStatusResponseDTO Status updated
     * @throws ApiError
     */
    public static profileControllerUpdateCustomStatus(
        requestBody: UpdateStatusRequestDTO,
    ): CancelablePromise<UpdateCustomStatusResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/profile/status',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid status`,
            },
        });
    }
    /**
     * Clear custom status
     * @returns UpdateCustomStatusResponseDTO Status cleared
     * @throws ApiError
     */
    public static profileControllerClearCustomStatus(): CancelablePromise<UpdateCustomStatusResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/profile/status',
        });
    }
    /**
     * Get bulk custom statuses
     * @param requestBody
     * @returns BulkStatusesResponseDTO Bulk statuses
     * @throws ApiError
     */
    public static profileControllerGetBulkStatuses(
        requestBody: BulkStatusRequestDTO,
    ): CancelablePromise<BulkStatusesResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/profile/status/bulk',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Update username style
     * @param requestBody
     * @returns UpdateStyleResponseDTO Style updated
     * @throws ApiError
     */
    public static profileControllerUpdateUsernameStyle(
        requestBody: UpdateStyleRequestDTO,
    ): CancelablePromise<UpdateStyleResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/profile/style',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Lookup user by username
     * @param username
     * @returns UserLookupResponseDTO
     * @throws ApiError
     */
    public static profileControllerLookupUserByUsername(
        username: string,
    ): CancelablePromise<UserLookupResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/profile/lookup/{username}',
            path: {
                username: username,
            },
            errors: {
                404: `User not found`,
            },
        });
    }
    /**
     * Lookup multiple user profiles by ID
     * @returns UserProfileResponseDTO
     * @throws ApiError
     */
    public static profileControllerBulkLookupUsers(): CancelablePromise<
        Array<UserProfileResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/profile/bulk',
        });
    }
    /**
     * Change username
     * @param requestBody
     * @returns ChangeUsernameResponseDTO Username changed
     * @throws ApiError
     */
    public static profileControllerChangeUsername(
        requestBody: ChangeUsernameRequestDTO,
    ): CancelablePromise<ChangeUsernameResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/profile/username',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                409: `Username taken`,
            },
        });
    }
    /**
     * Update language
     * @param requestBody
     * @returns UpdateLanguageResponseDTO Language updated
     * @throws ApiError
     */
    public static profileControllerUpdateLanguage(
        requestBody: UpdateLanguageRequestDTO,
    ): CancelablePromise<UpdateLanguageResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/profile/language',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * Get profile picture
     * @param filename
     * @returns string Profile picture
     * @throws ApiError
     */
    public static profileControllerGetProfilePicture(
        filename: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/profile/picture/{filename}',
            path: {
                filename: filename,
            },
            errors: {
                400: `Invalid filename`,
                404: `Image not found`,
            },
        });
    }
}
