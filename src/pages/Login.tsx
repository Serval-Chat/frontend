import React from 'react';

import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { useLoginForm } from '@/hooks/useLoginForm';
import { FormContent } from '@/ui/components/auth/FormContent';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { InputWrapper } from '@/ui/components/common/InputWrapper';
import { MutedText } from '@/ui/components/common/MutedText';
import { StatusMessage } from '@/ui/components/common/StatusMessage';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { DefaultBackground } from '@/ui/components/layout/DefaultBackground';

/**
 * @description Login page
 */
export const Login: React.FC = () => {
    const { isAuthenticated } = useAuth();
    const {
        loginInput,
        setLoginInput,
        password,
        setPassword,
        status,
        requiresTwoFactor,
        twoFactorCode,
        setTwoFactorCode,
        useBackupCode,
        setUseBackupCode,
        resetTwoFactorState,
        handleSubmit,
    } = useLoginForm();

    if (isAuthenticated) return <Navigate replace to="/chat" />;

    return (
        <Box className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-md">
            <DefaultBackground />

            {/* Login Box */}
            <FormContent>
                <Box className="space-y-sm text-center">
                    <Heading variant="page">HELLO!</Heading>
                    <Text as="p">
                        If you see this, you need to log in to chat on this
                        server.
                    </Text>
                    <MutedText>
                        Not invited yet? Ask the owner (
                        <Text weight="bold">catflare</Text>).
                    </MutedText>
                    <Text as="p">Got your login info? Enter it below!</Text>
                </Box>

                <form
                    className="space-y-md"
                    onSubmit={(e) => void handleSubmit(e)}
                >
                    <InputWrapper>
                        {requiresTwoFactor ? (
                            <Input
                                className="bg-background/50"
                                placeholder={
                                    useBackupCode
                                        ? 'Backup code (XXXX-XXXX)'
                                        : '6-digit authenticator code'
                                }
                                type="text"
                                value={twoFactorCode}
                                onChange={(e) =>
                                    setTwoFactorCode(
                                        e.target.value
                                            .toUpperCase()
                                            .replace(/\s+/g, ''),
                                    )
                                }
                            />
                        ) : (
                            <Input
                                autoComplete="username"
                                className="bg-background/50"
                                name="email"
                                placeholder="E-mail"
                                type="text"
                                value={loginInput}
                                onChange={(e) => setLoginInput(e.target.value)}
                            />
                        )}
                    </InputWrapper>
                    {!requiresTwoFactor && (
                        <>
                            <InputWrapper>
                                <Input
                                    autoComplete="current-password"
                                    className="bg-background/50"
                                    name="password"
                                    placeholder="Password"
                                    type="password"
                                    value={password}
                                    onChange={(e) =>
                                        setPassword(e.target.value)
                                    }
                                />
                            </InputWrapper>
                            <div className="text-right">
                                <Link
                                    className="text-sm text-primary hover:underline"
                                    to="/forgot-password"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </>
                    )}
                    {requiresTwoFactor && (
                        <div className="flex items-center justify-between text-sm">
                            <button
                                className="text-primary hover:underline"
                                type="button"
                                onClick={() =>
                                    setUseBackupCode((current) => !current)
                                }
                            >
                                {useBackupCode
                                    ? 'Use authenticator code'
                                    : 'Use backup code'}
                            </button>
                            <button
                                className="text-muted-foreground hover:underline"
                                type="button"
                                onClick={resetTwoFactorState}
                            >
                                Back
                            </button>
                        </div>
                    )}
                    <Button
                        className="w-full py-sm text-lg font-semibold"
                        type="submit"
                        variant="normal"
                    >
                        {requiresTwoFactor ? 'Verify 2FA' : 'There we go!'}
                    </Button>
                </form>

                <StatusMessage message={status.message} type={status.type} />
            </FormContent>
        </Box>
    );
};
