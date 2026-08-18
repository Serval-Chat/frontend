import {
    type UseMutationResult,
    type UseQueryResult,
    useMutation,
    useQuery,
    useQueryClient,
} from '@tanstack/react-query';

import { hasAuthToken, removeAuthToken, setAuthToken } from '@/utils/authToken';

import { authApi } from './auth.api';
import type {
    ChangeLoginRequest,
    ChangeLoginResponse,
    ChangePasswordRequest,
    ChangePasswordResponse,
    LogoutResponse,
    RevokeSessionsResponse,
    SessionListResponse,
    UpdateSessionIpResponse,
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

export const useSessions = (): UseQueryResult<SessionListResponse> =>
    useQuery({
        queryKey: ['sessions'],
        queryFn: authApi.listSessions,
        enabled: hasAuthToken(),
    });

export const useRevokeSession = (): UseMutationResult<
    RevokeSessionsResponse,
    Error,
    string
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: authApi.revokeSession,
        onSuccess: async (): Promise<void> => {
            await queryClient.invalidateQueries({ queryKey: ['sessions'] });
        },
    });
};

export const useRevokeOtherSessions = (): UseMutationResult<
    RevokeSessionsResponse,
    Error,
    void
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: authApi.revokeOtherSessions,
        onSuccess: async (): Promise<void> => {
            await queryClient.invalidateQueries({ queryKey: ['sessions'] });
        },
    });
};

export const useLogout = (): UseMutationResult<LogoutResponse, Error, void> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: authApi.logout,
        onSettled: async (): Promise<void> => {
            await removeAuthToken();
            queryClient.clear();
        },
    });
};

export const useUpdateSessionIp = (): UseMutationResult<
    UpdateSessionIpResponse,
    Error,
    { sessionId: string; ip: string }
> => {
    const queryClient = useQueryClient();
    return useMutation({
        mutationFn: ({ sessionId, ip }): Promise<UpdateSessionIpResponse> =>
            authApi.updateSessionIp(sessionId, ip),
        onSuccess: async (): Promise<void> => {
            await queryClient.invalidateQueries({ queryKey: ['sessions'] });
        },
    });
};
