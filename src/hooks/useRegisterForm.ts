import { useState } from 'react';

import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

import { authApi } from '@/api/auth/auth.api';
import type { StatusState } from '@/ui/types';
import { setAuthToken } from '@/utils/authToken';

interface ValidationErrors {
    login?: string;
    username?: string;
    password?: string;
    inviteToken?: string;
}

interface RegisterFormResult {
    login: string;
    setLogin: (value: string) => void;
    username: string;
    setUsername: (value: string) => void;
    password: string;
    setPassword: (value: string) => void;
    inviteToken: string;
    setInviteToken: (value: string) => void;
    status: StatusState;
    setStatus: React.Dispatch<React.SetStateAction<StatusState>>;
    errors: ValidationErrors;
    isLoading: boolean;
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
    const [errors, setErrors] = useState<ValidationErrors>({});
    const [isLoading, setIsLoading] = useState(false);

    const navigate = useNavigate();

    const validateField = (name: string, value: string) => {
        let error = '';
        switch (name) {
            case 'login':
                if (!value.trim()) error = 'Login is required';
                else if (value.length < 3)
                    error = 'Login must be at least 3 characters';
                else if (value.length > 50)
                    error = 'Login must be at most 50 characters';
                break;
            case 'username':
                if (!value.trim()) error = 'Username is required';
                else if (value.length < 3)
                    error = 'Username must be at least 3 characters';
                else if (value.length > 22)
                    error = 'Username must be at most 22 characters';
                else if (!/^[a-zA-Z0-9_]/.test(value))
                    error =
                        'Username must start with a letter, number, or underscore';
                else if (!/^[a-zA-Z0-9_.-]+$/.test(value))
                    error =
                        'Username can only contain letters, numbers, underscores, hyphens, and dots';
                else if (value.includes('..'))
                    error = 'Username cannot contain consecutive dots';
                break;
            case 'password':
                if (!value) error = 'Password is required';
                else if (value.length < 6)
                    error = 'Password must be at least 6 characters';
                else if (value.length > 100)
                    error = 'Password must be at most 100 characters';
                break;
            case 'inviteToken':
                if (!value.trim()) error = 'Invite token is required';
                else if (value.length > 100) error = 'Invite token is too long';
                break;
        }
        setErrors((prev) => ({ ...prev, [name]: error }));
    };

    const handleSetLogin = (val: string) => {
        setLogin(val);
        validateField('login', val);
    };

    const handleSetUsername = (val: string) => {
        setUsername(val);
        validateField('username', val);
    };

    const handleSetPassword = (val: string) => {
        setPassword(val);
        validateField('password', val);
    };

    const handleSetInviteToken = (val: string) => {
        setInviteToken(val);
        validateField('inviteToken', val);
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setStatus({ message: '', type: '' });

        // Final check before submission
        const currentErrors: ValidationErrors = {};
        if (!login.trim()) currentErrors.login = 'Login is required';
        if (!username.trim()) currentErrors.username = 'Username is required';
        if (!password) currentErrors.password = 'Password is required';
        if (!inviteToken.trim())
            currentErrors.inviteToken = 'Invite token is required';

        if (
            Object.values(currentErrors).some((e) => e) ||
            Object.values(errors).some((e) => e)
        ) {
            setErrors({ ...errors, ...currentErrors });
            setStatus({
                message: 'Please fix the errors below.',
                type: 'error',
            });
            return;
        }

        setIsLoading(true);
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
                errorMessage =
                    error.response?.data?.error ||
                    error.response?.data?.message ||
                    errorMessage;
            }
            setStatus({
                message: errorMessage,
                type: 'error',
            });
        } finally {
            setIsLoading(false);
        }
    };

    return {
        login,
        setLogin: handleSetLogin,
        username,
        setUsername: handleSetUsername,
        password,
        setPassword: handleSetPassword,
        inviteToken,
        setInviteToken: handleSetInviteToken,
        status,
        setStatus,
        errors,
        isLoading,
        handleSubmit,
    };
};
