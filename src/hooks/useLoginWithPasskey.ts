import { useState } from 'react';

import { startAuthentication } from '@simplewebauthn/browser';
import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

import { passkeyApi } from '@/api/passkey/passkey.api';
import { completeLogin } from '@/hooks/completeLogin';
import { isWebAuthnCancellation } from '@/utils/webauthn';

interface BanInfo {
    reason?: string;
    expirationTimestamp?: string;
}

interface LoginWithPasskeyResult {
    isLoading: boolean;
    error: string | null;
    banInfo: BanInfo | null;
    resetBan: () => void;
    loginWithPasskey: () => Promise<void>;
}

export const useLoginWithPasskey = (): LoginWithPasskeyResult => {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const resetBan = (): void => {
        setBanInfo(null);
    };

    const loginWithPasskey = async (): Promise<void> => {
        setError(null);
        setIsLoading(true);
        try {
            const { flowId, options } = await passkeyApi.loginOptions();

            let credential;
            try {
                credential = await startAuthentication({
                    optionsJSON: options,
                });
            } catch (err) {
                if (isWebAuthnCancellation(err)) return;
                throw err;
            }

            const data = await passkeyApi.loginVerify({ flowId, credential });
            if (!data.token) {
                setError('Passkey sign-in failed');
                return;
            }

            await completeLogin(data.token, true, navigate, queryClient);
        } catch (err: unknown) {
            if (isAxiosError(err)) {
                const axiosErr = err as AxiosError<{
                    error?: string;
                    ban?: { reason?: string; expirationTimestamp?: string };
                }>;
                if (
                    axiosErr.response?.status === 403 &&
                    axiosErr.response.data?.ban
                ) {
                    setBanInfo(axiosErr.response.data.ban);
                    return;
                }
                setError(
                    axiosErr.response?.data?.error ?? 'Passkey sign-in failed',
                );
                return;
            }
            setError('Passkey sign-in failed');
        } finally {
            setIsLoading(false);
        }
    };

    return { isLoading, error, banInfo, resetBan, loginWithPasskey };
};
