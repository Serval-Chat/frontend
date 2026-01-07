import { apiClient } from '../client';
import type {
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    ChangeLoginRequest,
    ChangeLoginResponse,
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
};
