import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { passwordlessApi } from '@/api/passwordless/passwordless.api';
import { completeLogin } from '@/hooks/completeLogin';
import { useLoginWithRecoveryKey } from '@/hooks/useLoginWithRecoveryKey';

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({}),
}));

vi.mock('@/api/passwordless/passwordless.api', () => ({
    passwordlessApi: {
        recover: vi.fn(),
    },
}));

vi.mock('@/hooks/completeLogin', () => ({
    completeLogin: vi.fn(),
}));

const fakeSubmitEvent = {
    preventDefault: vi.fn(),
} as unknown as React.FormEvent;

describe('useLoginWithRecoveryKey', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does nothing when the form is not yet valid', async () => {
        const { result } = renderHook(() => useLoginWithRecoveryKey());

        await act(async () => {
            await result.current.handleSubmit(fakeSubmitEvent);
        });

        expect(passwordlessApi.recover).not.toHaveBeenCalled();
    });

    it('submits login+recoveryKey+captcha and completes login on success', async () => {
        vi.mocked(passwordlessApi.recover).mockResolvedValue({
            token: 'tok-1',
            username: 'user1',
        });

        const { result } = renderHook(() => useLoginWithRecoveryKey());
        act(() => {
            result.current.setLogin('user@example.com');
            result.current.setRecoveryKey('ABCD-1234');
            result.current.setTurnstileToken('turnstile-tok');
        });

        await act(async () => {
            await result.current.handleSubmit(fakeSubmitEvent);
        });

        expect(passwordlessApi.recover).toHaveBeenCalledWith({
            login: 'user@example.com',
            recoveryKey: 'ABCD-1234',
            cfTurnstileResponse: 'turnstile-tok',
        });
        expect(completeLogin).toHaveBeenCalledWith(
            'tok-1',
            true,
            expect.any(Function),
            expect.any(Object),
        );
        expect(result.current.error).toBeNull();
    });

    it('sets banInfo on a 403 response with a ban payload, without completing login', async () => {
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
        vi.mocked(passwordlessApi.recover).mockRejectedValue(axiosError);

        const { result } = renderHook(() => useLoginWithRecoveryKey());
        act(() => {
            result.current.setLogin('user@example.com');
            result.current.setRecoveryKey('ABCD-1234');
            result.current.setTurnstileToken('turnstile-tok');
        });

        await act(async () => {
            await result.current.handleSubmit(fakeSubmitEvent);
        });

        expect(completeLogin).not.toHaveBeenCalled();
        expect(result.current.banInfo).toEqual({ reason: 'spam' });
    });

    it('sets a generic error message on any other failure', async () => {
        vi.mocked(passwordlessApi.recover).mockRejectedValue(
            new Error('network down'),
        );

        const { result } = renderHook(() => useLoginWithRecoveryKey());
        act(() => {
            result.current.setLogin('user@example.com');
            result.current.setRecoveryKey('ABCD-1234');
            result.current.setTurnstileToken('turnstile-tok');
        });

        await act(async () => {
            await result.current.handleSubmit(fakeSubmitEvent);
        });

        expect(completeLogin).not.toHaveBeenCalled();
        expect(result.current.error).toBe('Recovery sign-in failed');
    });
});
