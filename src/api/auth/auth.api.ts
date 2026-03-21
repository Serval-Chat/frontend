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
    login: (data: LoginRequest) =>
        apiClient
            .post<LoginResponse>('/api/v1/auth/login', data)
            .then((r) => r.data),

    register: (data: RegisterRequest) =>
        apiClient
            .post<RegisterResponse>('/api/v1/auth/register', data)
            .then((r) => r.data),

    changePassword: (data: ChangePasswordRequest) =>
        apiClient
            .patch<ChangePasswordResponse>('/api/v1/auth/password', data)
            .then((r) => r.data),

    changeLogin: (data: ChangeLoginRequest) =>
        apiClient
            .patch<ChangeLoginResponse>('/api/v1/auth/login', data)
            .then((r) => r.data),

    requestPasswordReset: (data: RequestPasswordResetRequest) =>
        apiClient
            .post<RequestPasswordResetResponse>(
                '/api/v1/auth/password/reset',
                data,
            )
            .then((r) => r.data),

    confirmPasswordReset: (data: ConfirmPasswordResetRequest) =>
        apiClient
            .post<ConfirmPasswordResetResponse>(
                '/api/v1/auth/password/reset/confirm',
                data,
            )
            .then((r) => r.data),

    verifyTwoFactor: (data: VerifyTwoFactorRequest) =>
        apiClient
            .post<LoginResponse>('/api/v1/auth/2fa/verify', data)
            .then((r) => r.data),

    setupTwoFactor: () =>
        apiClient
            .post<TotpSetupResponse>('/api/v1/auth/2fa/setup')
            .then((r) => r.data),

    confirmTwoFactorSetup: (data: TotpSetupConfirmRequest) =>
        apiClient
            .post<TotpSetupConfirmResponse>(
                '/api/v1/auth/2fa/setup/confirm',
                data,
            )
            .then((r) => r.data),

    regenerateBackupCodes: (data: TotpSensitiveActionRequest) =>
        apiClient
            .post<TotpSetupConfirmResponse>(
                '/api/v1/auth/2fa/backup-codes/regenerate',
                data,
            )
            .then((r) => r.data),

    disableTwoFactor: (data: TotpSensitiveActionRequest) =>
        apiClient
            .post<{ message: string }>('/api/v1/auth/2fa/disable', data)
            .then((r) => r.data),
};
