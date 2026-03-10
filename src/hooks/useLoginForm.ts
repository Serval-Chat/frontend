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
    handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const useLoginForm = (): LoginFormResult => {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<StatusState>({
        message: '',
        type: '',
    });
    const navigate = useNavigate();
    const queryClient = useQueryClient();

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setStatus({ message: '', type: '' });

        if (!loginInput || !password) {
            setStatus({ message: 'Please fill in all fields.', type: 'error' });
            return;
        }

        try {
            const data = await authApi.login({ login: loginInput, password });
            await setAuthToken(data.token);
            await queryClient.invalidateQueries({ queryKey: ['me'] });

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
        handleSubmit,
    };
};
