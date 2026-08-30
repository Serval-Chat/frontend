import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import type { AxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

import { passwordlessApi } from '@/api/passwordless/passwordless.api';
import { completeLogin } from '@/hooks/completeLogin';

interface BanInfo {
    reason?: string;
    expirationTimestamp?: string;
}

interface LoginWithRecoveryKeyResult {
    login: string;
    setLogin: React.Dispatch<React.SetStateAction<string>>;
    recoveryKey: string;
    setRecoveryKey: React.Dispatch<React.SetStateAction<string>>;
    turnstileToken: string;
    setTurnstileToken: React.Dispatch<React.SetStateAction<string>>;
    isLoading: boolean;
    error: string | null;
    banInfo: BanInfo | null;
    resetBan: () => void;
    isFormValid: boolean;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const useLoginWithRecoveryKey = (): LoginWithRecoveryKeyResult => {
    const [login, setLogin] = useState('');
    const [recoveryKey, setRecoveryKey] = useState('');
    const [turnstileToken, setTurnstileToken] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [banInfo, setBanInfo] = useState<BanInfo | null>(null);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const resetBan = (): void => {
        setBanInfo(null);
    };

    const isFormValid = !!login && !!recoveryKey && !!turnstileToken;

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setError(null);
        if (!isFormValid) return;

        setIsLoading(true);
        try {
            const data = await passwordlessApi.recover({
                login,
                recoveryKey,
                cfTurnstileResponse: turnstileToken,
            });
            if (!data.token) {
                setError('Recovery sign-in failed');
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
                    axiosErr.response?.data?.error ?? 'Recovery sign-in failed',
                );
                return;
            }
            setError('Recovery sign-in failed');
        } finally {
            setIsLoading(false);
        }
    };

    return {
        login,
        setLogin,
        recoveryKey,
        setRecoveryKey,
        turnstileToken,
        setTurnstileToken,
        isLoading,
        error,
        banInfo,
        resetBan,
        isFormValid,
        handleSubmit,
    };
};
