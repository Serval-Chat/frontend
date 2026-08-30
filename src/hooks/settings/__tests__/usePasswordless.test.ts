import { WebAuthnError, startAuthentication } from '@simplewebauthn/browser';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { passwordlessApi } from '@/api/passwordless/passwordless.api';
import { usePasswordless } from '@/hooks/settings/usePasswordless';
import { setAuthToken } from '@/utils/authToken';

vi.mock('@/api/passwordless/passwordless.api', () => ({
    passwordlessApi: {
        enable: vi.fn(),
        regenerateRecoveryKeysOptions: vi.fn(),
        regenerateRecoveryKeysVerify: vi.fn(),
    },
}));

vi.mock('@/utils/authToken', () => ({
    setAuthToken: vi.fn(),
}));

const mockInvalidate = vi.fn();
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));

const mockShowToast = vi.fn();
vi.mock('@/ui/components/common/Toast', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

describe('usePasswordless', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('enable', () => {
        it('stores the new token, invalidates me, and reveals the recovery keys', async () => {
            vi.mocked(passwordlessApi.enable).mockResolvedValue({
                recoveryKeys: ['CODE-0001', 'CODE-0002'],
                token: 'tok-new',
            });

            const { result } = renderHook(() => usePasswordless());
            await act(async () => {
                await result.current.enable('current-pw');
            });

            expect(passwordlessApi.enable).toHaveBeenCalledWith({
                password: 'current-pw',
            });
            expect(setAuthToken).toHaveBeenCalledWith('tok-new');
            expect(mockInvalidate).toHaveBeenCalledWith({
                queryKey: ['me'],
            });
            expect(result.current.recoveryKeys).toEqual([
                'CODE-0001',
                'CODE-0002',
            ]);
        });

        it('surfaces a failure via toast and leaves recoveryKeys null', async () => {
            vi.mocked(passwordlessApi.enable).mockRejectedValue(
                new Error('nope'),
            );

            const { result } = renderHook(() => usePasswordless());
            await act(async () => {
                await result.current.enable('wrong-pw');
            });

            expect(mockShowToast).toHaveBeenCalledWith('nope', 'error');
            expect(result.current.recoveryKeys).toBeNull();
        });
    });

    describe('regenerateRecoveryKeys', () => {
        it('calls options -> startAuthentication -> verify in order and reveals new keys', async () => {
            vi.mocked(
                passwordlessApi.regenerateRecoveryKeysOptions,
            ).mockResolvedValue({
                flowId: 'flow-1',
                options: { challenge: 'c' },
            } as never);
            vi.mocked(startAuthentication).mockResolvedValue({
                id: 'cred-1',
            } as never);
            vi.mocked(
                passwordlessApi.regenerateRecoveryKeysVerify,
            ).mockResolvedValue({
                recoveryKeys: ['NEW-0001'],
            });

            const { result } = renderHook(() => usePasswordless());
            await act(async () => {
                await result.current.regenerateRecoveryKeys();
            });

            expect(startAuthentication).toHaveBeenCalledWith({
                optionsJSON: { challenge: 'c' },
            });
            expect(
                passwordlessApi.regenerateRecoveryKeysVerify,
            ).toHaveBeenCalledWith({
                flowId: 'flow-1',
                credential: { id: 'cred-1' },
            });
            expect(result.current.recoveryKeys).toEqual(['NEW-0001']);
        });

        it('swallows a NotAllowedError cancellation silently', async () => {
            vi.mocked(
                passwordlessApi.regenerateRecoveryKeysOptions,
            ).mockResolvedValue({ flowId: 'flow-1', options: {} } as never);
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

            const { result } = renderHook(() => usePasswordless());
            await act(async () => {
                await result.current.regenerateRecoveryKeys();
            });

            expect(
                passwordlessApi.regenerateRecoveryKeysVerify,
            ).not.toHaveBeenCalled();
            expect(mockShowToast).not.toHaveBeenCalled();
        });
    });

    describe('closeRecoveryKeysModal', () => {
        it('clears the revealed recovery keys', async () => {
            vi.mocked(passwordlessApi.enable).mockResolvedValue({
                recoveryKeys: ['CODE-0001'],
                token: 'tok-new',
            });

            const { result } = renderHook(() => usePasswordless());
            await act(async () => {
                await result.current.enable('pw');
            });
            expect(result.current.recoveryKeys).not.toBeNull();

            act(() => {
                result.current.closeRecoveryKeysModal();
            });

            expect(result.current.recoveryKeys).toBeNull();
        });
    });
});
