import { WebAuthnError, startAuthentication } from '@simplewebauthn/browser';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { passkeyApi } from '@/api/passkey/passkey.api';
import { completeLogin } from '@/hooks/completeLogin';
import { useLoginWithPasskey } from '@/hooks/useLoginWithPasskey';

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({}),
}));

vi.mock('@/api/passkey/passkey.api', () => ({
    passkeyApi: {
        loginOptions: vi.fn(),
        loginVerify: vi.fn(),
    },
}));

vi.mock('@/hooks/completeLogin', () => ({
    completeLogin: vi.fn(),
}));

describe('useLoginWithPasskey', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('calls loginOptions -> startAuthentication -> loginVerify -> completeLogin in order', async () => {
        vi.mocked(passkeyApi.loginOptions).mockResolvedValue({
            flowId: 'flow-1',
            options: { challenge: 'c' },
        } as never);
        vi.mocked(startAuthentication).mockResolvedValue({
            id: 'cred-1',
        } as never);
        vi.mocked(passkeyApi.loginVerify).mockResolvedValue({
            token: 'tok-1',
            username: 'user1',
        } as never);

        const { result } = renderHook(() => useLoginWithPasskey());
        await act(async () => {
            await result.current.loginWithPasskey();
        });

        expect(passkeyApi.loginOptions).toHaveBeenCalled();
        expect(startAuthentication).toHaveBeenCalledWith({
            optionsJSON: { challenge: 'c' },
        });
        expect(passkeyApi.loginVerify).toHaveBeenCalledWith({
            flowId: 'flow-1',
            credential: { id: 'cred-1' },
        });
        expect(completeLogin).toHaveBeenCalledWith(
            'tok-1',
            true,
            expect.any(Function),
            expect.any(Object),
        );
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('leaves isLoading false with no error/navigation on a NotAllowedError cancellation', async () => {
        vi.mocked(passkeyApi.loginOptions).mockResolvedValue({
            flowId: 'flow-1',
            options: {},
        } as never);
        const cause = new Error('cancelled');
        cause.name = 'NotAllowedError';
        vi.mocked(startAuthentication).mockRejectedValue(
            new WebAuthnError({
                message: 'x',
                code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
                cause,
                name: 'NotAllowedError',
            }),
        );

        const { result } = renderHook(() => useLoginWithPasskey());
        await act(async () => {
            await result.current.loginWithPasskey();
        });

        expect(passkeyApi.loginVerify).not.toHaveBeenCalled();
        expect(completeLogin).not.toHaveBeenCalled();
        expect(result.current.isLoading).toBe(false);
        expect(result.current.error).toBeNull();
    });

    it('sets banInfo on a 403 response with a ban payload, without calling completeLogin', async () => {
        vi.mocked(passkeyApi.loginOptions).mockResolvedValue({
            flowId: 'flow-1',
            options: {},
        } as never);
        vi.mocked(startAuthentication).mockResolvedValue({
            id: 'cred-1',
        } as never);
        const axiosError = Object.assign(new Error('Forbidden'), {
            isAxiosError: true,
            response: {
                status: 403,
                data: {
                    error: 'Your account has been banned',
                    ban: { reason: 'spam' },
                },
            },
        });
        vi.mocked(passkeyApi.loginVerify).mockRejectedValue(axiosError);

        const { result } = renderHook(() => useLoginWithPasskey());
        await act(async () => {
            await result.current.loginWithPasskey();
        });

        expect(completeLogin).not.toHaveBeenCalled();
        expect(result.current.banInfo).toEqual({ reason: 'spam' });
    });

    it('sets a generic error message on any other failure', async () => {
        vi.mocked(passkeyApi.loginOptions).mockResolvedValue({
            flowId: 'flow-1',
            options: {},
        } as never);
        vi.mocked(startAuthentication).mockResolvedValue({
            id: 'cred-1',
        } as never);
        vi.mocked(passkeyApi.loginVerify).mockRejectedValue(
            new Error('network down'),
        );

        const { result } = renderHook(() => useLoginWithPasskey());
        await act(async () => {
            await result.current.loginWithPasskey();
        });

        expect(completeLogin).not.toHaveBeenCalled();
        expect(result.current.error).toBe('Passkey sign-in failed');
    });
});
