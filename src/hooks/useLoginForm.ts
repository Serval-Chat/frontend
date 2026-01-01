import { useState } from 'react';

export type StatusType = 'error' | 'success' | '';

export interface StatusState {
    message: string;
    type: StatusType;
}

export const useLoginForm = () => {
    const [loginInput, setLoginInput] = useState('');
    const [password, setPassword] = useState('');
    const [status, setStatus] = useState<StatusState>({
        message: '',
        type: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setStatus({ message: '', type: '' });

        if (!loginInput || !password) {
            setStatus({ message: 'Please fill in all fields.', type: 'error' });
            return;
        }

        // todo: add the api for logging in but really? theres no use for it for now.
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
