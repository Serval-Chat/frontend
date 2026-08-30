import { apiClient } from '@/api/client';

import type {
    PasskeyAuthenticationOptionsResponse,
    PasskeyAuthenticationVerifyRequest,
    PasskeyCredentialSummary,
    PasskeyDeleteResponse,
    PasskeyListResponse,
    PasskeyLoginResponse,
    PasskeyRegistrationOptionsResponse,
    PasskeyRegistrationVerifyRequest,
    PasskeyRegistrationVerifyResponse,
    RenamePasskeyRequest,
} from './passkey.types';

export const passkeyApi = {
    list: (): Promise<PasskeyListResponse> =>
        apiClient
            .get<PasskeyListResponse>('/api/v1/auth/passkey')
            .then((r): PasskeyListResponse => r.data),

    registerOptions: (): Promise<PasskeyRegistrationOptionsResponse> =>
        apiClient
            .post<PasskeyRegistrationOptionsResponse>(
                '/api/v1/auth/passkey/register/options',
            )
            .then((r): PasskeyRegistrationOptionsResponse => r.data),

    registerVerify: (
        data: PasskeyRegistrationVerifyRequest,
    ): Promise<PasskeyRegistrationVerifyResponse> =>
        apiClient
            .post<PasskeyRegistrationVerifyResponse>(
                '/api/v1/auth/passkey/register/verify',
                data,
            )
            .then((r): PasskeyRegistrationVerifyResponse => r.data),

    rename: (
        id: string,
        data: RenamePasskeyRequest,
    ): Promise<PasskeyCredentialSummary> =>
        apiClient
            .patch<PasskeyCredentialSummary>(`/api/v1/auth/passkey/${id}`, data)
            .then((r): PasskeyCredentialSummary => r.data),

    remove: (id: string): Promise<PasskeyDeleteResponse> =>
        apiClient
            .delete<PasskeyDeleteResponse>(`/api/v1/auth/passkey/${id}`)
            .then((r): PasskeyDeleteResponse => r.data),

    loginOptions: (): Promise<PasskeyAuthenticationOptionsResponse> =>
        apiClient
            .post<PasskeyAuthenticationOptionsResponse>(
                '/api/v1/auth/passkey/login/options',
            )
            .then((r): PasskeyAuthenticationOptionsResponse => r.data),

    loginVerify: (
        data: PasskeyAuthenticationVerifyRequest,
    ): Promise<PasskeyLoginResponse> =>
        apiClient
            .post<PasskeyLoginResponse>(
                '/api/v1/auth/passkey/login/verify',
                data,
            )
            .then((r): PasskeyLoginResponse => r.data),
};
