import {
    type UseMutationResult,
    useMutation,
    useQueryClient,
} from '@tanstack/react-query';

import { setAuthToken } from '@/utils/authToken';

import { authApi } from './auth.api';
import type {
    ChangeLoginRequest,
    ChangeLoginResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
} from './auth.types';

export const useChangePassword = (): UseMutationResult<
    ChangePasswordResponse,
    Error,
    ChangePasswordRequest
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: authApi.changePassword,
        onSuccess: async (data): Promise<void> => {
            await setAuthToken(data.token);
            await queryClient.invalidateQueries({ queryKey: ['me'] });
        },
    });
};

export const useChangeLogin = (): UseMutationResult<
    ChangeLoginResponse,
    Error,
    ChangeLoginRequest
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: authApi.changeLogin,
        onSuccess: async (data): Promise<void> => {
            await setAuthToken(data.token);
            await queryClient.invalidateQueries({ queryKey: ['me'] });
        },
    });
};
