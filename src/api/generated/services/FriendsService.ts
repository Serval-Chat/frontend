/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { AcceptFriendRequestResponseDTO } from '../models/AcceptFriendRequestResponseDTO';
import type { FriendResponseDTO } from '../models/FriendResponseDTO';
import type { FriendshipMessageResponseDTO } from '../models/FriendshipMessageResponseDTO';
import type { IncomingFriendRequestResponseDTO } from '../models/IncomingFriendRequestResponseDTO';
import type { OutgoingFriendRequestResponseDTO } from '../models/OutgoingFriendRequestResponseDTO';
import type { SendFriendRequestDTO } from '../models/SendFriendRequestDTO';
import type { SendFriendRequestResponseDTO } from '../models/SendFriendRequestResponseDTO';

export class FriendsService {
    /**
     * Get friends list
     * @returns FriendResponseDTO
     * @throws ApiError
     */
    public static friendshipControllerGetFriends(): CancelablePromise<
        Array<FriendResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/friends',
        });
    }
    /**
     * Send a friend request
     * @param requestBody
     * @returns SendFriendRequestResponseDTO
     * @throws ApiError
     */
    public static friendshipControllerSendFriendRequest(
        requestBody: SendFriendRequestDTO,
    ): CancelablePromise<SendFriendRequestResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/friends',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `User not found or already friends`,
                404: `User not found`,
            },
        });
    }
    /**
     * Get full profiles for all friends in one request
     * @returns FriendResponseDTO Array of full user profiles
     * @throws ApiError
     */
    public static friendshipControllerGetFriendProfiles(): CancelablePromise<
        Array<FriendResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/friends/profiles',
        });
    }
    /**
     * Get incoming friend requests
     * @returns IncomingFriendRequestResponseDTO
     * @throws ApiError
     */
    public static friendshipControllerGetIncomingRequests(): CancelablePromise<
        Array<IncomingFriendRequestResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/friends/incoming',
        });
    }
    /**
     * Get outgoing friend requests
     * @returns OutgoingFriendRequestResponseDTO
     * @throws ApiError
     */
    public static friendshipControllerGetOutgoingRequests(): CancelablePromise<
        Array<OutgoingFriendRequestResponseDTO>
    > {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/friends/outgoing',
        });
    }
    /**
     * Accept a friend request
     * @param id
     * @returns AcceptFriendRequestResponseDTO
     * @throws ApiError
     */
    public static friendshipControllerAcceptFriendRequest(
        id: string,
    ): CancelablePromise<AcceptFriendRequestResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/friends/{id}/accept',
            path: {
                id: id,
            },
            errors: {
                403: `Forbidden`,
                404: `Request not found`,
            },
        });
    }
    /**
     * Reject a friend request
     * @param id
     * @returns FriendshipMessageResponseDTO
     * @throws ApiError
     */
    public static friendshipControllerRejectFriendRequest(
        id: string,
    ): CancelablePromise<FriendshipMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/friends/{id}/reject',
            path: {
                id: id,
            },
            errors: {
                403: `Forbidden`,
                404: `Request not found`,
            },
        });
    }
    /**
     * Cancel a friend request
     * @param id
     * @returns FriendshipMessageResponseDTO
     * @throws ApiError
     */
    public static friendshipControllerCancelFriendRequest(
        id: string,
    ): CancelablePromise<FriendshipMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/friends/{id}/cancel',
            path: {
                id: id,
            },
            errors: {
                403: `Forbidden`,
                404: `Request not found`,
            },
        });
    }
    /**
     * Remove a friend
     * @param friendId
     * @returns FriendshipMessageResponseDTO
     * @throws ApiError
     */
    public static friendshipControllerRemoveFriend(
        friendId: string,
    ): CancelablePromise<FriendshipMessageResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/friends/{friendId}',
            path: {
                friendId: friendId,
            },
            errors: {
                404: `User Not Found`,
            },
        });
    }
}
