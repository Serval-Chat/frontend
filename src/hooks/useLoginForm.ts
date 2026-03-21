import { useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

import { authApi } from '@/api/auth/auth.api';
import {
    checkAndMigrateVapid,
    listenForSwNavigation,
    setupWebPush,
} from '@/lib/pushClient';
import type { StatusState } from '@/ui/types';
import { setAuthToken } from '@/utils/authToken';

interface LoginFormResult {
    loginInput: string;
    setLoginInput: React.Dispatch<React.SetStateAction<string>>;
    password: string;
    setPassword: React.Dispatch<React.SetStateAction<string>>;
    status: StatusState;
    setStatus: React.Dispatch<React.SetStateAction<StatusState>>;
    requiresTwoFactor: boolean;
    twoFactorCode: string;
    setTwoFactorCode: React.Dispatch<React.SetStateAction<string>>;
    useBackupCode: boolean;
    setUseBackupCode: React.Dispatch<React.SetStateAction<boolean>>;
    resetTwoFactorState: () => void;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const useLoginForm = (): LoginFormResult => {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<StatusState>({
        message: '',
        type: '',
    });
    const [requiresTwoFactor, setRequiresTwoFactor] = useState(false);
    const [tempToken, setTempToken] = useState('');
    const [twoFactorCode, setTwoFactorCode] = useState('');
    const [useBackupCode, setUseBackupCode] = useState(false);
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const resetTwoFactorState = (): void => {
        setRequiresTwoFactor(false);
        setTempToken('');
        setTwoFactorCode('');
        setUseBackupCode(false);
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setStatus({ message: '', type: '' });

        if (!requiresTwoFactor && (!loginInput || !password)) {
            setStatus({ message: 'Please fill in all fields.', type: 'error' });
            return;
        }
        if (requiresTwoFactor && !twoFactorCode.trim()) {
            setStatus({
                message: useBackupCode
                    ? 'Please enter your backup code.'
                    : 'Please enter your 2FA code.',
                type: 'error',
            });
            return;
        }

        try {
            let data;
            if (!requiresTwoFactor) {
                data = await authApi.login({ login: loginInput, password });
                if (data.two_factor_required && data.temp_token) {
                    setRequiresTwoFactor(true);
                    setTempToken(data.temp_token);
                    setStatus({
                        message:
                            'Two-factor authentication is enabled. Enter your code to continue.',
                        type: 'success',
                    });
                    return;
                }
            } else {
                data = await authApi.verifyTwoFactor({
                    tempToken,
                    ...(useBackupCode
                        ? { backupCode: twoFactorCode }
                        : { code: twoFactorCode }),
                });
            }

            if (!data?.token) {
                setStatus({
                    message: 'Login failed',
                    type: 'error',
                });
                return;
            }
            await setAuthToken(data.token);
            await queryClient.invalidateQueries({ queryKey: ['me'] });
            resetTwoFactorState();

            await setupWebPush();
            await checkAndMigrateVapid();
            listenForSwNavigation((url) => {
                void navigate(url);
            });

            void navigate('/chat');
        } catch (error: unknown) {
            let errorMessage = 'Login failed';
            if (isAxiosError(error)) {
                errorMessage = error.response?.data?.message || errorMessage;
            }
            setStatus({
                message: errorMessage,
                type: 'error',
            });
        }
    };

    return {
        loginInput,
        setLoginInput,
        password,
        setPassword,
        status,
        setStatus,
        requiresTwoFactor,
        twoFactorCode,
        setTwoFactorCode,
        useBackupCode,
        setUseBackupCode,
        resetTwoFactorState,
        handleSubmit,
    };
};
