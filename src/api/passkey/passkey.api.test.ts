import { describe, expect, it, vi } from 'vitest';

import { apiClient } from '@/api/client';

import { passkeyApi } from './passkey.api';

vi.mock('@/api/client', () => ({
    apiClient: {
        get: vi.fn(),
        post: vi.fn(),
        patch: vi.fn(),
        delete: vi.fn(),
    },
}));

const mockResponse = <T>(data: T): { data: T } => ({ data });

describe('passkeyApi', () => {
    it('list GETs the passkey collection', async () => {
        vi.mocked(apiClient.get).mockResolvedValue(
            mockResponse({ passkeys: [] }),
        );
        const result = await passkeyApi.list();
        expect(apiClient.get).toHaveBeenCalledWith('/api/v1/auth/passkey');
        expect(result).toEqual({ passkeys: [] });
    });

    it('registerOptions POSTs to register/options', async () => {
        vi.mocked(apiClient.post).mockResolvedValue(
            mockResponse({ options: {} }),
        );
        await passkeyApi.registerOptions();
        expect(apiClient.post).toHaveBeenCalledWith(
            '/api/v1/auth/passkey/register/options',
        );
    });

    it('registerVerify POSTs the credential to register/verify', async () => {
        vi.mocked(apiClient.post).mockResolvedValue(
            mockResponse({ passkey: {} }),
        );
        const body = { credential: { id: 'cred-1' } as never, name: 'Key' };
        await passkeyApi.registerVerify(body);
        expect(apiClient.post).toHaveBeenCalledWith(
            '/api/v1/auth/passkey/register/verify',
            body,
        );
    });

    it('rename PATCHes the given credential id', async () => {
        vi.mocked(apiClient.patch).mockResolvedValue(mockResponse({}));
        await passkeyApi.rename('pk-1', { name: 'New name' });
        expect(apiClient.patch).toHaveBeenCalledWith(
            '/api/v1/auth/passkey/pk-1',
            { name: 'New name' },
        );
    });

    it('remove DELETEs the given credential id', async () => {
        vi.mocked(apiClient.delete).mockResolvedValue(
            mockResponse({ message: 'ok' }),
        );
        await passkeyApi.remove('pk-1');
        expect(apiClient.delete).toHaveBeenCalledWith(
            '/api/v1/auth/passkey/pk-1',
        );
    });

    it('loginOptions POSTs to login/options', async () => {
        vi.mocked(apiClient.post).mockResolvedValue(
            mockResponse({ flowId: 'f', options: {} }),
        );
        await passkeyApi.loginOptions();
        expect(apiClient.post).toHaveBeenCalledWith(
            '/api/v1/auth/passkey/login/options',
        );
    });

    it('loginVerify POSTs the flowId and credential to login/verify', async () => {
        vi.mocked(apiClient.post).mockResolvedValue(
            mockResponse({ token: 't', username: 'u' }),
        );
        const body = {
            flowId: 'f',
            credential: { id: 'cred-1' } as never,
        };
        await passkeyApi.loginVerify(body);
        expect(apiClient.post).toHaveBeenCalledWith(
            '/api/v1/auth/passkey/login/verify',
            body,
        );
    });
});
