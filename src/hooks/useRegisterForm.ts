import { useState } from 'react';
import type { StatusState } from '@/ui/types';

export const useRegisterForm = () => {
    const [login, setLogin] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [inviteToken, setInviteToken] = useState('');
    const [status, setStatus] = useState<StatusState>({
        message: '',
        type: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ message: '', type: '' });

        if (!login || !username || !password || !inviteToken) {
            setStatus({ message: 'Please fill in all fields.', type: 'error' });
            return;
        }

        setStatus({ message: 'Hewwo', type: 'success' });

        // todo: add the api for registering but really? theres no use for it for now.
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
