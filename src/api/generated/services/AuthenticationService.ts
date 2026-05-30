/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { CancelablePromise } from '../core/CancelablePromise';
import { OpenAPI } from '../core/OpenAPI';
import { request as __request } from '../core/request';
import type { ChangeLoginRequestDTO } from '../models/ChangeLoginRequestDTO';
import type { ChangeLoginResponseDTO } from '../models/ChangeLoginResponseDTO';
import type { ChangePasswordRequestDTO } from '../models/ChangePasswordRequestDTO';
import type { ChangePasswordResponseDTO } from '../models/ChangePasswordResponseDTO';
import type { Disable2FAResponseDTO } from '../models/Disable2FAResponseDTO';
import type { LoginRequestDTO } from '../models/LoginRequestDTO';
import type { LoginResponseDTO } from '../models/LoginResponseDTO';
import type { PasswordResetConfirmDTO } from '../models/PasswordResetConfirmDTO';
import type { PasswordResetRequestDTO } from '../models/PasswordResetRequestDTO';
import type { PasswordResetResponseDTO } from '../models/PasswordResetResponseDTO';
import type { RegisterRequestDTO } from '../models/RegisterRequestDTO';
import type { RegisterResponseDTO } from '../models/RegisterResponseDTO';
import type { TotpSensitiveActionRequestDTO } from '../models/TotpSensitiveActionRequestDTO';
import type { TotpSetupConfirmRequestDTO } from '../models/TotpSetupConfirmRequestDTO';
import type { TotpSetupConfirmResponseDTO } from '../models/TotpSetupConfirmResponseDTO';
import type { TotpSetupResponseDTO } from '../models/TotpSetupResponseDTO';
import type { TotpVerifyRequestDTO } from '../models/TotpVerifyRequestDTO';

export class AuthenticationService {
    /**
     * @param requestBody
     * @returns LoginResponseDTO
     * @throws ApiError
     */
    public static authControllerLogin(
        requestBody: LoginRequestDTO,
    ): CancelablePromise<LoginResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                401: `Invalid credentials`,
                403: `Account banned`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ChangeLoginResponseDTO
     * @throws ApiError
     */
    public static authControllerChangeLogin(
        requestBody: ChangeLoginRequestDTO,
    ): CancelablePromise<ChangeLoginResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/auth/login',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input`,
                401: `Invalid password`,
                409: `Login already taken`,
            },
        });
    }
    /**
     * @returns TotpSetupResponseDTO
     * @throws ApiError
     */
    public static authControllerSetupTwoFactor(): CancelablePromise<TotpSetupResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/2fa/setup',
        });
    }
    /**
     * @param requestBody
     * @returns TotpSetupConfirmResponseDTO
     * @throws ApiError
     */
    public static authControllerConfirmTwoFactorSetup(
        requestBody: TotpSetupConfirmRequestDTO,
    ): CancelablePromise<TotpSetupConfirmResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/2fa/setup/confirm',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns LoginResponseDTO
     * @throws ApiError
     */
    public static authControllerVerifyTwoFactor(
        requestBody: TotpVerifyRequestDTO,
    ): CancelablePromise<LoginResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/2fa/verify',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns TotpSetupConfirmResponseDTO
     * @throws ApiError
     */
    public static authControllerRegenerateBackupCodes(
        requestBody: TotpSensitiveActionRequestDTO,
    ): CancelablePromise<TotpSetupConfirmResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/2fa/backup-codes/regenerate',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns Disable2FAResponseDTO
     * @throws ApiError
     */
    public static authControllerDisableTwoFactor(
        requestBody: TotpSensitiveActionRequestDTO,
    ): CancelablePromise<Disable2FAResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/2fa/disable',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns RegisterResponseDTO
     * @throws ApiError
     */
    public static authControllerRegister(
        requestBody: RegisterRequestDTO,
    ): CancelablePromise<RegisterResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/register',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Validation Error`,
                403: `Invalid invite token`,
                500: `Internal server error`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns ChangePasswordResponseDTO
     * @throws ApiError
     */
    public static authControllerChangePassword(
        requestBody: ChangePasswordRequestDTO,
    ): CancelablePromise<ChangePasswordResponseDTO> {
        return __request(OpenAPI, {
            method: 'PATCH',
            url: '/api/v1/auth/password',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid input`,
                401: `Invalid current password`,
            },
        });
    }
    /**
     * @param requestBody
     * @returns PasswordResetResponseDTO
     * @throws ApiError
     */
    public static authControllerRequestPasswordReset(
        requestBody: PasswordResetRequestDTO,
    ): CancelablePromise<PasswordResetResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/password/reset',
            body: requestBody,
            mediaType: 'application/json',
        });
    }
    /**
     * @param requestBody
     * @returns PasswordResetResponseDTO
     * @throws ApiError
     */
    public static authControllerConfirmPasswordReset(
        requestBody: PasswordResetConfirmDTO,
    ): CancelablePromise<PasswordResetResponseDTO> {
        return __request(OpenAPI, {
            method: 'POST',
            url: '/api/v1/auth/password/reset/confirm',
            body: requestBody,
            mediaType: 'application/json',
            errors: {
                400: `Invalid or expired token`,
            },
        });
    }
}
