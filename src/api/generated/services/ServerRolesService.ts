/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { CreateRoleRequestDTO } from '../models/CreateRoleRequestDTO';
import type { ReorderRolesRequestDTO } from '../models/ReorderRolesRequestDTO';
import type { RoleDeleteResponseDTO } from '../models/RoleDeleteResponseDTO';
import type { RoleIconResponseDTO } from '../models/RoleIconResponseDTO';
import type { RoleReorderResponseDTO } from '../models/RoleReorderResponseDTO';
import type { ServerRoleResponseDTO } from '../models/ServerRoleResponseDTO';
import type { UpdateRoleRequestDTO } from '../models/UpdateRoleRequestDTO';

export class ServerRolesService {
    /**
     * Get server roles
     * @param serverId
     * @returns ServerRoleResponseDTO Roles retrieved
     * @throws ApiError
     */
    public static serverRoleControllerGetServerRoles(
        serverId: string,
    ): CancelablePromise<Array<ServerRoleResponseDTO>> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/roles',
            path: {
                serverId: serverId,
            },
            errors: {
                403: `Not a member of this server`,
            },
        });
    }
    /**
     * Create a role
     * @param serverId
     * @param requestBody
     * @returns ServerRoleResponseDTO Role created
     * @throws ApiError
     */
    public static serverRoleControllerCreateRole(
        serverId: string,
        requestBody: CreateRoleRequestDTO,
    ): CancelablePromise<ServerRoleResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/roles',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `No permission to manage roles`,
            },
        });
    }
    /**
     * Reorder roles
     * @param serverId
     * @param requestBody
     * @returns RoleReorderResponseDTO Roles reordered
     * @throws ApiError
     */
    public static serverRoleControllerReorderRoles(
        serverId: string,
        requestBody: ReorderRolesRequestDTO,
    ): CancelablePromise<RoleReorderResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}/roles/reorder',
            path: {
                serverId: serverId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `No permission to manage roles`,
            },
        });
    }
    /**
     * Update a role
     * @param serverId
     * @param roleId
     * @param requestBody
     * @returns ServerRoleResponseDTO Role updated
     * @throws ApiError
     */
    public static serverRoleControllerUpdateRole(
        serverId: string,
        roleId: string,
        requestBody: UpdateRoleRequestDTO,
    ): CancelablePromise<ServerRoleResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/servers/{serverId}/roles/{roleId}',
            path: {
                serverId: serverId,
                roleId: roleId,
            },
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                403: `No permission to manage roles`,
                404: `Role not found`,
            },
        });
    }
    /**
     * Delete a role
     * @param serverId
     * @param roleId
     * @returns RoleDeleteResponseDTO Role deleted
     * @throws ApiError
     */
    public static serverRoleControllerDeleteRole(
        serverId: string,
        roleId: string,
    ): CancelablePromise<RoleDeleteResponseDTO> {
        return __request(OpenAPI, {
            method: 'DELETE',
            url: '/api/v1/servers/{serverId}/roles/{roleId}',
            path: {
                serverId: serverId,
                roleId: roleId,
            },
            errors: {
                400: `Cannot delete @everyone role`,
                403: `No permission to manage roles`,
                404: `Role not found`,
            },
        });
    }
    /**
     * Upload role icon
     * @param serverId
     * @param roleId
     * @param formData
     * @returns RoleIconResponseDTO Role icon uploaded
     * @throws ApiError
     */
    public static serverRoleControllerUploadRoleIcon(
        serverId: string,
        roleId: string,
        formData: {
            icon?: Blob;
        },
    ): CancelablePromise<RoleIconResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/servers/{serverId}/roles/{roleId}/icon',
            path: {
                serverId: serverId,
                roleId: roleId,
            },
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                403: `No permission to manage roles`,
            },
        });
    }
    /**
     * Get role icon
     * @param filename
     * @returns string Role icon image
     * @throws ApiError
     */
    public static serverRoleControllerGetRoleIcon(
        filename: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/servers/{serverId}/roles/icon/{filename}',
            path: {
                filename: filename,
            },
            errors: {
                404: `Icon not found`,
            },
        });
    }
}
