import React, { useState } from 'react';

import { useChangeLogin } from '@/api/auth/auth.queries';
import { type ApiError } from '@/api/types';
import { useMe } from '@/api/users/users.queries';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { Box } from '@/ui/components/layout/Box';

interface ChangeLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangeLoginModal: React.FC<ChangeLoginModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { showToast } = useToast();
    const { data: user } = useMe();
    const { mutate: changeLogin, isPending } = useChangeLogin();

    const [newLogin, setNewLogin] = useState('');
    const [password, setPassword] = useState('');

    const [errors, setErrors] = useState<{
        newLogin?: string;
        password?: string;
    }>({});

    const handleClose = (): void => {
        setNewLogin('');
        setPassword('');
        setErrors({});
        onClose();
    };

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();

        const newErrors: typeof errors = {};

        if (!newLogin) {
            newErrors.newLogin = 'New login is required';
        } else if (newLogin === user?.login) {
            newErrors.newLogin =
                'New login must be different from current login';
        }

        if (!password) {
            newErrors.password = 'Password is required';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        changeLogin(
            { newLogin, password },
            {
                onSuccess: () => {
                    showToast('Login updated successfully', 'success');
                    handleClose();
                },
                onError: (error: unknown) => {
                    showToast(
                        (error as ApiError).response?.data?.message ||
                            'Failed to update login',
                        'error',
                    );
                },
            },
        );
    };

    return (
        <Modal isOpen={isOpen} title="Change Login" onClose={handleClose}>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <Box className="space-y-4">
                    <Box className="space-y-2">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                            htmlFor="current-login"
                        >
                            Current Login
                        </label>
                        <Input
                            disabled
                            id="current-login"
                            type="text"
                            value={user?.login || ''}
                        />
                    </Box>

                    <Box className="space-y-2">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                            htmlFor="new-login"
                        >
                            New Login
                        </label>
                        <Input
                            id="new-login"
                            type="text"
                            value={newLogin}
                            onChange={(e) => setNewLogin(e.target.value)}
                        />
                        {errors.newLogin && (
                            <Text
                                className="text-[var(--color-status-error)]"
                                size="xs"
                            >
                                {errors.newLogin}
                            </Text>
                        )}
                    </Box>

                    <Box className="space-y-2">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                            htmlFor="password"
                        >
                            Confirm Password
                        </label>
                        <Input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        {errors.password && (
                            <Text
                                className="text-[var(--color-status-error)]"
                                size="xs"
                            >
                                {errors.password}
                            </Text>
                        )}
                        <Text size="xs" variant="muted">
                            Enter your current password to confirm this change.
                        </Text>
                    </Box>
                </Box>

                <Box className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] -mx-6 -mb-6 p-6">
                    <Button type="button" variant="ghost" onClick={handleClose}>
                        Cancel
                    </Button>
                    <Button
                        className="bg-primary hover:bg-primary-hover text-white border-none"
                        loading={isPending}
                        type="submit"
                    >
                        Update Login
                    </Button>
                </Box>
            </form>
        </Modal>
    );
};
