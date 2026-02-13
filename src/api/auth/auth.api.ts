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
};
