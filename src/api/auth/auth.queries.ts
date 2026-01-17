import { type UseMutationResult, useMutation } from '@tanstack/react-query';

import { setAuthToken } from '@/utils/authToken';

import { authApi } from './auth.api';
import type {
    ChangeLoginRequest,
    ChangeLoginResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    LoginRequest,
    LoginResponse,
    RegisterRequest,
    RegisterResponse,
} from './auth.types';

export const useLogin = (): UseMutationResult<
    LoginResponse,
    Error,
    LoginRequest
> =>
    useMutation({
        mutationFn: authApi.login,
        onSuccess: (data) => {
            setAuthToken(data.token);
        },
    });

export const useRegister = (): UseMutationResult<
    RegisterResponse,
    Error,
    RegisterRequest
> =>
    useMutation({
        mutationFn: authApi.register,
        onSuccess: (data) => {
            setAuthToken(data.token);
        },
    });

export const useChangePassword = (): UseMutationResult<
    ChangePasswordResponse,
    Error,
    ChangePasswordRequest
> =>
    useMutation({
        mutationFn: authApi.changePassword,
        onSuccess: (data) => {
            setAuthToken(data.token);
        },
    });

export const useChangeLogin = (): UseMutationResult<
    ChangeLoginResponse,
    Error,
    ChangeLoginRequest
> =>
    useMutation({
        mutationFn: authApi.changeLogin,
        onSuccess: (data) => {
            setAuthToken(data.token);
        },
    });
