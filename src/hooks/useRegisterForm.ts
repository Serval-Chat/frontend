import { useState } from 'react';

import { isAxiosError } from 'axios';
import { useNavigate } from 'react-router-dom';

import { authApi } from '@/api/auth/auth.api';
import type { StatusState } from '@/ui/types';
import { setAuthToken } from '@/utils/authToken';
import {
    validateInviteToken,
    validateLogin,
    validatePassword,
    validateUsername,
} from '@/utils/validation';

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

    const validateField = (name: string, value: string): void => {
        let error = '';
        switch (name) {
            case 'login':
                error = validateLogin(value);
                break;
            case 'username':
                error = validateUsername(value);
                break;
            case 'password':
                error = validatePassword(value);
                break;
            case 'inviteToken':
                error = validateInviteToken(value);
                break;
        }
        setErrors((prev) => ({ ...prev, [name]: error }));
    };

    const handleSetLogin = (val: string): void => {
        setLogin(val);
        validateField('login', val);
    };

    const handleSetUsername = (val: string): void => {
        setUsername(val);
        validateField('username', val);
    };

    const handleSetPassword = (val: string): void => {
        setPassword(val);
        validateField('password', val);
    };

    const handleSetInviteToken = (val: string): void => {
        setInviteToken(val);
        validateField('inviteToken', val);
    };

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setStatus({ message: '', type: '' });

        // Final check before submission
        const currentErrors: ValidationErrors = {};
        currentErrors.login = validateLogin(login);
        currentErrors.username = validateUsername(username);
        currentErrors.password = validatePassword(password);
        currentErrors.inviteToken = validateInviteToken(inviteToken);

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
