/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { FileMetadataResponseDTO } from '../models/FileMetadataResponseDTO';
import type { FileUploadResponseDTO } from '../models/FileUploadResponseDTO';

export class FilesService {
    /**
     * Upload a file
     * @param formData
     * @returns FileUploadResponseDTO
     * @throws ApiError
     */
    public static fileControllerUploadFile(formData: {
        file?: Blob;
    }): CancelablePromise<FileUploadResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/files/upload',
            formData: formData,
            mediaType: 'multipart/form-data',
        });
    }
    /**
     * Get file metadata
     * @param filename
     * @returns FileMetadataResponseDTO
     * @throws ApiError
     */
    public static fileControllerGetFileMetadata(
        filename: string,
    ): CancelablePromise<FileMetadataResponseDTO> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/files/metadata/{filename}',
            path: {
                filename: filename,
            },
            errors: {
                400: `Invalid filename`,
                404: `File not found`,
            },
        });
    }
    /**
     * Download a file
     * @param filename
     * @returns string File stream
     * @throws ApiError
     */
    public static fileControllerDownloadFile(
        filename: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/files/download/{filename}',
            path: {
                filename: filename,
            },
            errors: {
                400: `Invalid filename`,
                404: `File not found`,
            },
        });
    }
    /**
     * Download a file (legacy)
     * @param filename
     * @returns string File stream
     * @throws ApiError
     */
    public static fileCompatibilityControllerDownloadFile(
        filename: string,
    ): CancelablePromise<string> {
        return __request(OpenAPI, {
            method: 'GET',
            url: '/api/v1/download/{filename}',
            path: {
                filename: filename,
            },
            errors: {
                400: `Invalid filename`,
                404: `File not found`,
            },
        });
    }
}
