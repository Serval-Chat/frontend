import { apiClient } from '@/api/client';

import type {
    EnablePasswordlessRequest,
    EnablePasswordlessResponse,
    RecoveryKeyLoginRequest,
    RecoveryKeyLoginResponse,
    RegenerateRecoveryKeysOptionsResponse,
    RegenerateRecoveryKeysVerifyRequest,
    RegenerateRecoveryKeysVerifyResponse,
} from './passwordless.types';

export const passwordlessApi = {
    enable: (
        data: EnablePasswordlessRequest,
    ): Promise<EnablePasswordlessResponse> =>
        apiClient
            .post<EnablePasswordlessResponse>(
                '/api/v1/auth/passwordless/enable',
                data,
            )
            .then((r): EnablePasswordlessResponse => r.data),

    regenerateRecoveryKeysOptions: (): Promise<RegenerateRecoveryKeysOptionsResponse> =>
        apiClient
            .post<RegenerateRecoveryKeysOptionsResponse>(
                '/api/v1/auth/passwordless/recovery-keys/regenerate/options',
            )
            .then((r): RegenerateRecoveryKeysOptionsResponse => r.data),

    regenerateRecoveryKeysVerify: (
        data: RegenerateRecoveryKeysVerifyRequest,
    ): Promise<RegenerateRecoveryKeysVerifyResponse> =>
        apiClient
            .post<RegenerateRecoveryKeysVerifyResponse>(
                '/api/v1/auth/passwordless/recovery-keys/regenerate/verify',
                data,
            )
            .then((r): RegenerateRecoveryKeysVerifyResponse => r.data),

    recover: (
        data: RecoveryKeyLoginRequest,
    ): Promise<RecoveryKeyLoginResponse> =>
        apiClient
            .post<RecoveryKeyLoginResponse>(
                '/api/v1/auth/passwordless/recover',
                data,
            )
            .then((r): RecoveryKeyLoginResponse => r.data),
};
