import React, { useEffect, useState } from 'react';

import { useLocation, useNavigate } from 'react-router-dom';

import { authApi } from '@/api/auth/auth.api';
import type { ApiError } from '@/api/types';
import { FormContent } from '@/ui/components/auth/FormContent';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { InputWrapper } from '@/ui/components/common/InputWrapper';
import { StatusMessage } from '@/ui/components/common/StatusMessage';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { DefaultBackground } from '@/ui/components/layout/DefaultBackground';

export const ResetPassword: React.FC = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const [token, setToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [status, setStatus] = useState<{
        type: 'error' | 'success';
        message: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        // Extract token from hash fragment: #token=...
        const hash = location.hash;
        if (hash) {
            const params = new URLSearchParams(hash.substring(1)); // remove '#'
            const tokenParam = params.get('token');
            if (tokenParam) {
                setToken(tokenParam);
            }
        }
    }, [location]);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();

        if (newPassword !== confirmPassword) {
            setStatus({
                type: 'error',
                message: 'Passwords do not match.',
            });
            return;
        }

        if (!token) {
            setStatus({
                type: 'error',
                message: 'Missing reset token within URL.',
            });
            return;
        }

        setIsLoading(true);
        setStatus(null);

        try {
            await authApi.confirmPasswordReset({
                token,
                newPassword,
            });
            setStatus({
                type: 'success',
                message: 'Password reset successful! Redirecting to login...',
            });
            void setTimeout(() => {
                void navigate('/login');
            }, 2000);
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error && 'response' in error
                    ? ((error as ApiError).response?.data?.message ??
                      'Failed to reset password. The link may have expired.')
                    : 'Failed to reset password. The link may have expired.';
            setStatus({
                type: 'error',
                message: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    if (!token) {
        return (
            <Box className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden p-md">
                <DefaultBackground />
                <FormContent>
                    <Box className="text-center space-y-sm">
                        <Heading variant="page">Invalid Link</Heading>
                        <Text as="p" className="text-red-500">
                            No reset token found in the URL. Please use the link
                            sent to your email.
                        </Text>
                    </Box>
                </FormContent>
            </Box>
        );
    }

    return (
        <Box className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden p-md">
            <DefaultBackground />

            <FormContent>
                <Box className="text-center space-y-sm">
                    <Heading variant="page">Reset Password</Heading>
                    <Text as="p">Enter your new password below.</Text>
                </Box>

                <form
                    className="space-y-md"
                    onSubmit={(e) => {
                        void handleSubmit(e);
                    }}
                >
                    <InputWrapper>
                        <Input
                            required
                            className="bg-background/50"
                            minLength={8}
                            placeholder="New Password"
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            required
                            className="bg-background/50"
                            minLength={8}
                            placeholder="Confirm New Password"
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                        />
                    </InputWrapper>
                    <Button
                        className="w-full py-sm text-lg font-semibold"
                        disabled={isLoading}
                        type="submit"
                        variant="normal"
                    >
                        {isLoading ? 'Resetting...' : 'Reset Password'}
                    </Button>
                </form>

                {status && (
                    <StatusMessage
                        message={status.message}
                        type={status.type}
                    />
                )}
            </FormContent>
        </Box>
    );
};
