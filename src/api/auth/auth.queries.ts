import { useMutation } from '@tanstack/react-query';
import { authApi } from './auth.api';
import { setAuthToken } from '@/utils/authToken';

export const useLogin = () => {
    return useMutation({
        mutationFn: authApi.login,
        onSuccess: (data) => {
            setAuthToken(data.token);
        },
    });
};

export const useRegister = () => {
    return useMutation({
        mutationFn: authApi.register,
        onSuccess: (data) => {
            setAuthToken(data.token);
        },
    });
};

export const useChangePassword = () => {
    return useMutation({
        mutationFn: authApi.changePassword,
        onSuccess: (data) => {
            setAuthToken(data.token);
        },
    });
};

export const useChangeLogin = () => {
    return useMutation({
        mutationFn: authApi.changeLogin,
        onSuccess: (data) => {
            setAuthToken(data.token);
        },
    });
};
