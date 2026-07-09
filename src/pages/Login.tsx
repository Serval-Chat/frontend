import { useState } from 'react';

import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { useLoginForm } from '@/hooks/useLoginForm';
import { FormContent } from '@/ui/components/auth/FormContent';
import { Admonition } from '@/ui/components/common/Admonition';
import { BannedScreen } from '@/ui/components/common/BannedScreen';
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
export const Login = () => {
    const { isAuthenticated } = useAuth();
    const {
        loginInput,
        setLoginInput,
        password,
        setPassword,
        rememberMe,
        setRememberMe,
        status,
        requiresTwoFactor,
        twoFactorCode,
        setTwoFactorCode,
        useBackupCode,
        setUseBackupCode,
        resetTwoFactorState,
        handleSubmit,
        isLoading,
        isFormValid,
        banInfo,
        resetBan,
    } = useLoginForm();
    const [showPassword, setShowPassword] = useState(false);

    if (isAuthenticated) return <Navigate replace to="/chat/@me" />;

    if (banInfo !== null) {
        return (
            <BannedScreen
                expirationTimestamp={banInfo.expirationTimestamp}
                reason={banInfo.reason}
                onLogout={resetBan}
            />
        );
    }

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
                    onSubmit={(e): undefined => void handleSubmit(e)}
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
                                onChange={(e): void => {
                                    setTwoFactorCode(
                                        e.target.value
                                            .toUpperCase()
                                            .replaceAll(/\s+/g, ''),
                                    );
                                }}
                            />
                        ) : (
                            <Input
                                autoComplete="username"
                                className="bg-background/50"
                                name="email"
                                placeholder="E-mail"
                                type="text"
                                value={loginInput}
                                onChange={(e): void => {
                                    setLoginInput(e.target.value);
                                }}
                            />
                        )}
                    </InputWrapper>
                    {requiresTwoFactor ? null : (
                        <>
                            <InputWrapper>
                                <div className="relative">
                                    <Input
                                        autoComplete="current-password"
                                        className="bg-background/50 pr-10"
                                        name="password"
                                        placeholder="Password"
                                        type={
                                            showPassword ? 'text' : 'password'
                                        }
                                        value={password}
                                        onChange={(e): void => {
                                            setPassword(e.target.value);
                                        }}
                                    />
                                    <button
                                        aria-label={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                        className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                        title={
                                            showPassword
                                                ? 'Hide password'
                                                : 'Show password'
                                        }
                                        type="button"
                                        onClick={(): void => {
                                            setShowPassword(!showPassword);
                                        }}
                                    >
                                        {showPassword ? (
                                            <EyeOff size={18} />
                                        ) : (
                                            <Eye size={18} />
                                        )}
                                    </button>
                                </div>
                            </InputWrapper>
                            <div className="flex items-center justify-between text-sm">
                                <label className="flex cursor-pointer items-center gap-2">
                                    <input
                                        checked={rememberMe}
                                        className="border-border/50 h-4 w-4 rounded bg-background/50 text-primary focus:ring-primary"
                                        type="checkbox"
                                        onChange={(e): void => {
                                            setRememberMe(e.target.checked);
                                        }}
                                    />
                                    <Text className="text-muted-foreground select-none">
                                        Remember Me
                                    </Text>
                                </label>
                                <Link
                                    className="text-primary hover:underline"
                                    to="/forgot-password"
                                >
                                    Forgot Password?
                                </Link>
                            </div>
                        </>
                    )}
                    {requiresTwoFactor ? (
                        <div className="flex items-center justify-between text-sm">
                            <button
                                className="text-primary hover:underline"
                                type="button"
                                onClick={(): void => {
                                    setUseBackupCode(
                                        (current): boolean => !current,
                                    );
                                }}
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
                    ) : null}
                    <Button
                        className="flex w-full items-center justify-center gap-2 py-sm text-lg font-semibold"
                        disabled={!isFormValid || isLoading}
                        type="submit"
                        variant="normal"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : requiresTwoFactor ? (
                            'Verify 2FA'
                        ) : (
                            'There we go!'
                        )}
                    </Button>
                </form>

                <Admonition
                    node={{
                        type: 'admonition',
                        admonitionType: 'info',
                        style: 'github',
                        content: [],
                    }}
                >
                    If you created an account without an e-mail (as in just
                    text) you probably won't be able to log in. Please contact{' '}
                    <Text weight="bold">@catflare</Text> on Discord for
                    assistance! I'm sorry for this inconvenience.
                </Admonition>

                <StatusMessage message={status.message} type={status.type} />
            </FormContent>
        </Box>
    );
};
