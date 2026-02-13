import React, { useState } from 'react';

import { authApi } from '@/api/auth/auth.api';
import type { ApiError } from '@/api/types';
import { FormContent } from '@/ui/components/auth/FormContent';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { InputWrapper } from '@/ui/components/common/InputWrapper';
import { Link } from '@/ui/components/common/Link';
import { StatusMessage } from '@/ui/components/common/StatusMessage';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { DefaultBackground } from '@/ui/components/layout/DefaultBackground';

export const ForgotPassword: React.FC = () => {
    const [email, setEmail] = useState('');
    const [status, setStatus] = useState<{
        type: 'error' | 'success';
        message: string;
    } | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent): Promise<void> => {
        e.preventDefault();
        setIsLoading(true);
        setStatus(null);

        try {
            await authApi.requestPasswordReset({ email });
            setStatus({
                type: 'success',
                message:
                    'If an account with that email exists, we sent you a link to reset your password.',
            });
            // Clear input on success
            setEmail('');
        } catch (error: unknown) {
            const errorMessage =
                error instanceof Error && 'response' in error
                    ? ((error as ApiError).response?.data?.message ??
                      'An error occurred. Please try again later.')
                    : 'An error occurred. Please try again later.';
            setStatus({
                type: 'error',
                message: errorMessage,
            });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Box className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden p-md">
            <DefaultBackground />

            <FormContent>
                <Box className="text-center space-y-sm">
                    <Heading variant="page">Forgot Password?</Heading>
                    <Text as="p">
                        No worries! Enter your email and we'll send you a reset
                        link.
                    </Text>
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
                            placeholder="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </InputWrapper>
                    <Button
                        className="w-full py-sm text-lg font-semibold"
                        disabled={isLoading}
                        type="submit"
                        variant="normal"
                    >
                        {isLoading ? 'Sending...' : 'Send Reset Link'}
                    </Button>
                </form>

                {status && (
                    <StatusMessage
                        message={status.message}
                        type={status.type}
                    />
                )}

                <Box className="text-center mt-md">
                    <Link to="/login">Back to Login</Link>
                </Box>
            </FormContent>
        </Box>
    );
};
