import React, { useState } from 'react';

import { useChangePassword } from '@/api/auth/auth.queries';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';
import { Box } from '@/ui/components/layout/Box';
import { validatePassword } from '@/utils/validation';

interface ChangePasswordModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({
    isOpen,
    onClose,
}) => {
    const { showToast } = useToast();
    const { mutate: changePassword, isPending } = useChangePassword();

    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [errors, setErrors] = useState<{
        current?: string;
        new?: string;
        confirm?: string;
    }>({});

    const handleClose = (): void => {
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        setErrors({});
        onClose();
    };

    const handleSubmit = (e: React.FormEvent): void => {
        e.preventDefault();

        const newPasswordError = validatePassword(newPassword);
        const newErrors: typeof errors = {};

        if (!currentPassword) {
            newErrors.current = 'Current password is required';
        }

        if (newPasswordError) {
            newErrors.new = newPasswordError;
        }

        if (newPassword !== confirmPassword) {
            newErrors.confirm = 'Passwords do not match';
        }

        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }

        changePassword(
            { currentPassword, newPassword },
            {
                onSuccess: () => {
                    showToast('Password updated successfully', 'success');
                    handleClose();
                },
                onError: (error) => {
                    showToast(
                        error.message || 'Failed to update password',
                        'error',
                    );
                },
            },
        );
    };

    return (
        <Modal isOpen={isOpen} title="Update Password" onClose={handleClose}>
            <form className="space-y-6" onSubmit={handleSubmit}>
                <Box className="space-y-4">
                    <Box className="space-y-2">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                            htmlFor="current-password"
                        >
                            Current Password
                        </label>
                        <Input
                            id="current-password"
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                        />
                        {errors.current && (
                            <Text
                                className="text-[var(--color-status-error)]"
                                size="xs"
                            >
                                {errors.current}
                            </Text>
                        )}
                    </Box>

                    <Box className="space-y-2">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                            htmlFor="new-password"
                        >
                            New Password
                        </label>
                        <Input
                            id="new-password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                        {errors.new && (
                            <Text
                                className="text-[var(--color-status-error)]"
                                size="xs"
                            >
                                {errors.new}
                            </Text>
                        )}
                    </Box>

                    <Box className="space-y-2">
                        <label
                            className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                            htmlFor="confirm-password"
                        >
                            Confirm New Password
                        </label>
                        <Input
                            id="confirm-password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                        {errors.confirm && (
                            <Text
                                className="text-[var(--color-status-error)]"
                                size="xs"
                            >
                                {errors.confirm}
                            </Text>
                        )}
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
                        Update Password
                    </Button>
                </Box>
            </form>
        </Modal>
    );
};
