import { WebAuthnError, startRegistration } from '@simplewebauthn/browser';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { passkeyApi } from '@/api/passkey/passkey.api';
import { usePasskeysQuery } from '@/api/passkey/passkey.queries';
import { usePasskeys } from '@/hooks/settings/usePasskeys';

vi.mock('@/api/passkey/passkey.api', () => ({
    passkeyApi: {
        registerOptions: vi.fn(),
        registerVerify: vi.fn(),
        rename: vi.fn(),
        remove: vi.fn(),
    },
}));

vi.mock('@/api/passkey/passkey.queries', () => ({
    usePasskeysQuery: vi.fn(),
}));

const mockInvalidate = vi.fn();
vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({ invalidateQueries: mockInvalidate }),
}));

const mockShowToast = vi.fn();
vi.mock('@/ui/components/common/Toast', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

describe('usePasskeys', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(usePasskeysQuery).mockReturnValue({
            data: { passkeys: [] },
            isLoading: false,
        } as never);
    });

    describe('registerPasskey', () => {
        it('calls registerOptions -> startRegistration -> registerVerify in order and invalidates', async () => {
            vi.mocked(passkeyApi.registerOptions).mockResolvedValue({
                options: { challenge: 'c' },
            } as never);
            vi.mocked(startRegistration).mockResolvedValue({
                id: 'cred-1',
            } as never);
            vi.mocked(passkeyApi.registerVerify).mockResolvedValue({
                passkey: {},
            } as never);

            const { result } = renderHook(() => usePasskeys());
            await act(async () => {
                await result.current.registerPasskey('My key');
            });

            expect(passkeyApi.registerOptions).toHaveBeenCalled();
            expect(startRegistration).toHaveBeenCalledWith({
                optionsJSON: { challenge: 'c' },
            });
            expect(passkeyApi.registerVerify).toHaveBeenCalledWith({
                credential: { id: 'cred-1' },
                name: 'My key',
            });
            expect(mockInvalidate).toHaveBeenCalledWith({
                queryKey: ['passkeys'],
            });
        });

        it('swallows a NotAllowedError cancellation silently, without calling registerVerify', async () => {
            vi.mocked(passkeyApi.registerOptions).mockResolvedValue({
                options: {},
            } as never);
            const cause = new Error('cancelled');
            cause.name = 'NotAllowedError';
            vi.mocked(startRegistration).mockRejectedValue(
                new WebAuthnError({
                    message: 'x',
                    code: 'ERROR_PASSTHROUGH_SEE_CAUSE_PROPERTY',
                    cause,
                    name: 'NotAllowedError',
                }),
            );

            const { result } = renderHook(() => usePasskeys());
            await act(async () => {
                await result.current.registerPasskey();
            });

            expect(passkeyApi.registerVerify).not.toHaveBeenCalled();
            expect(mockShowToast).not.toHaveBeenCalled();
        });

        it('surfaces any other error via a toast without calling registerVerify', async () => {
            vi.mocked(passkeyApi.registerOptions).mockResolvedValue({
                options: {},
            } as never);
            vi.mocked(startRegistration).mockRejectedValue(new Error('boom'));

            const { result } = renderHook(() => usePasskeys());
            await act(async () => {
                await result.current.registerPasskey();
            });

            expect(passkeyApi.registerVerify).not.toHaveBeenCalled();
            expect(mockShowToast).toHaveBeenCalledWith('boom', 'error');
        });
    });

    describe('renamePasskey / removePasskey', () => {
        it('renamePasskey calls the api and invalidates', async () => {
            vi.mocked(passkeyApi.rename).mockResolvedValue({} as never);
            const { result } = renderHook(() => usePasskeys());

            await act(async () => {
                await result.current.renamePasskey('pk-1', 'New');
            });

            expect(passkeyApi.rename).toHaveBeenCalledWith('pk-1', {
                name: 'New',
            });
            expect(mockInvalidate).toHaveBeenCalledWith({
                queryKey: ['passkeys'],
            });
        });

        it('removePasskey calls the api and invalidates', async () => {
            vi.mocked(passkeyApi.remove).mockResolvedValue({
                message: 'ok',
            } as never);
            const { result } = renderHook(() => usePasskeys());

            await act(async () => {
                await result.current.removePasskey('pk-1');
            });

            expect(passkeyApi.remove).toHaveBeenCalledWith('pk-1');
            expect(mockInvalidate).toHaveBeenCalledWith({
                queryKey: ['passkeys'],
            });
        });
    });
});
