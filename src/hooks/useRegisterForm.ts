import { useState } from 'react';

import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

import { authApi } from '@/api/auth/auth.api';
import type { StatusState } from '@/ui/types';
import { setAuthToken } from '@/utils/authToken';

interface RegisterFormResult {
    login: string;
    setLogin: React.Dispatch<React.SetStateAction<string>>;
    username: string;
    setUsername: React.Dispatch<React.SetStateAction<string>>;
    password: string;
    setPassword: React.Dispatch<React.SetStateAction<string>>;
    inviteToken: string;
    setInviteToken: React.Dispatch<React.SetStateAction<string>>;
    status: StatusState;
    setStatus: React.Dispatch<React.SetStateAction<StatusState>>;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
}

export const useRegisterForm = (): RegisterFormResult => {
    const [login, setLogin] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [inviteToken, setInviteToken] = useState('');
    const [status, setStatus] = useState<StatusState>({
        message: '',
        type: '',
    });
    const navigate = useNavigate();

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setStatus({ message: '', type: '' });

        if (!login || !username || !password || !inviteToken) {
            setStatus({ message: 'Please fill in all fields.', type: 'error' });
            return;
        }

        try {
            const data = await authApi.register({
                login,
                username,
                password,
                invite: inviteToken,
            });
            setAuthToken(data.token);
            void navigate('/chat');
        } catch (error: unknown) {
            let errorMessage = 'Registration failed';
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
        login,
        setLogin,
        username,
        setUsername,
        password,
        setPassword,
        inviteToken,
        setInviteToken,
        status,
        setStatus,
        handleSubmit,
    };
};
