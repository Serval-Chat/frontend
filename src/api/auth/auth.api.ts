import { apiClient } from '@/api/client';

import type {
    ChangeLoginRequest,
    ChangeLoginResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    ConfirmPasswordResetRequest,
    ConfirmPasswordResetResponse,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    RequestPasswordResetRequest,
    RequestPasswordResetResponse,
    TotpSensitiveActionRequest,
    TotpSetupConfirmRequest,
    TotpSetupConfirmResponse,
    TotpSetupResponse,
    VerifyTwoFactorRequest,
} from './auth.types';

export const authApi = {
    login: (data: LoginRequest): Promise<LoginResponse> =>
        apiClient
            .post<LoginResponse>('/api/v1/auth/login', data)
            .then((r): LoginResponse => r.data),

    register: (data: RegisterRequest): Promise<RegisterResponse> =>
        apiClient
            .post<RegisterResponse>('/api/v1/auth/register', data)
            .then((r): RegisterResponse => r.data),

    changePassword: (
        data: ChangePasswordRequest,
    ): Promise<ChangePasswordResponse> =>
        apiClient
            .patch<ChangePasswordResponse>('/api/v1/auth/password', data)
            .then((r): ChangePasswordResponse => r.data),

    changeLogin: (data: ChangeLoginRequest): Promise<ChangeLoginResponse> =>
        apiClient
            .patch<ChangeLoginResponse>('/api/v1/auth/login', data)
            .then((r): ChangeLoginResponse => r.data),

    requestPasswordReset: (
        data: RequestPasswordResetRequest,
    ): Promise<RequestPasswordResetResponse> =>
        apiClient
            .post<RequestPasswordResetResponse>(
                '/api/v1/auth/password/reset',
                data,
            )
            .then((r): RequestPasswordResetResponse => r.data),

    confirmPasswordReset: (
        data: ConfirmPasswordResetRequest,
    ): Promise<ConfirmPasswordResetResponse> =>
        apiClient
            .post<ConfirmPasswordResetResponse>(
                '/api/v1/auth/password/reset/confirm',
                data,
            )
            .then((r): ConfirmPasswordResetResponse => r.data),

    verifyTwoFactor: (data: VerifyTwoFactorRequest): Promise<LoginResponse> =>
        apiClient
            .post<LoginResponse>('/api/v1/auth/2fa/verify', data)
            .then((r): LoginResponse => r.data),

    setupTwoFactor: (): Promise<TotpSetupResponse> =>
        apiClient
            .post<TotpSetupResponse>('/api/v1/auth/2fa/setup')
            .then((r): TotpSetupResponse => r.data),

    confirmTwoFactorSetup: (
        data: TotpSetupConfirmRequest,
    ): Promise<TotpSetupConfirmResponse> =>
        apiClient
            .post<TotpSetupConfirmResponse>(
                '/api/v1/auth/2fa/setup/confirm',
                data,
            )
            .then((r): TotpSetupConfirmResponse => r.data),

    regenerateBackupCodes: (
        data: TotpSensitiveActionRequest,
    ): Promise<TotpSetupConfirmResponse> =>
        apiClient
            .post<TotpSetupConfirmResponse>(
                '/api/v1/auth/2fa/backup-codes/regenerate',
                data,
            )
            .then((r): TotpSetupConfirmResponse => r.data),

    disableTwoFactor: (
        data: TotpSensitiveActionRequest,
    ): Promise<{ message: string }> =>
        apiClient
            .post<{ message: string }>('/api/v1/auth/2fa/disable', data)
            .then((r): { message: string } => r.data),
};
