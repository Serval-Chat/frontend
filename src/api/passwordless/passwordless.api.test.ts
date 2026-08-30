import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/api/client';

import { passwordlessApi } from './passwordless.api';

vi.mock('@/api/client', () => ({
    apiClient: {
        post: vi.fn(),
    },
}));

const mockResponse = <T>(data: T): { data: T } => ({ data });

describe('passwordlessApi', () => {
    it('enable POSTs the current password', async () => {
        vi.mocked(apiClient.post).mockResolvedValue(
            mockResponse({ recoveryKeys: [], token: 't' }),
        );
        await passwordlessApi.enable({ password: 'pw' });
        expect(apiClient.post).toHaveBeenCalledWith(
            '/api/v1/auth/passwordless/enable',
            { password: 'pw' },
        );
    });

    it('regenerateRecoveryKeysOptions POSTs with no body', async () => {
        vi.mocked(apiClient.post).mockResolvedValue(
            mockResponse({ flowId: 'f', options: {} }),
        );
        await passwordlessApi.regenerateRecoveryKeysOptions();
        expect(apiClient.post).toHaveBeenCalledWith(
            '/api/v1/auth/passwordless/recovery-keys/regenerate/options',
        );
    });

    it('regenerateRecoveryKeysVerify POSTs the flowId and credential', async () => {
        vi.mocked(apiClient.post).mockResolvedValue(
            mockResponse({ recoveryKeys: [] }),
        );
        const body = { flowId: 'f', credential: { id: 'cred-1' } as never };
        await passwordlessApi.regenerateRecoveryKeysVerify(body);
        expect(apiClient.post).toHaveBeenCalledWith(
            '/api/v1/auth/passwordless/recovery-keys/regenerate/verify',
            body,
        );
    });

    it('recover POSTs login, recoveryKey, and the captcha token', async () => {
        vi.mocked(apiClient.post).mockResolvedValue(
            mockResponse({ token: 't', username: 'u' }),
        );
        const body = {
            login: 'user@example.com',
            recoveryKey: 'ABCD-1234',
            cfTurnstileResponse: 'tok',
        };
        await passwordlessApi.recover(body);
        expect(apiClient.post).toHaveBeenCalledWith(
            '/api/v1/auth/passwordless/recover',
            body,
        );
    });
});
