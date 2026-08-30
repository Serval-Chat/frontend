import { useState } from 'react';

import { Turnstile } from '@marsidev/react-turnstile';
import { Loader2 } from 'lucide-react';
import { Link, Navigate } from 'react-router-dom';

import { useAuth } from '@/hooks/useAuth';
import { useLoginForm } from '@/hooks/useLoginForm';
import { useLoginWithPasskey } from '@/hooks/useLoginWithPasskey';
import { useLoginWithRecoveryKey } from '@/hooks/useLoginWithRecoveryKey';
import { FormContent } from '@/ui/components/auth/FormContent';
import { Admonition } from '@/ui/components/common/Admonition';
import { BannedScreen } from '@/ui/components/common/BannedScreen';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { InputWrapper } from '@/ui/components/common/InputWrapper';
import { MutedText } from '@/ui/components/common/MutedText';
import { PasswordInput } from '@/ui/components/common/PasswordInput';
import { StatusMessage } from '@/ui/components/common/StatusMessage';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { DefaultBackground } from '@/ui/components/layout/DefaultBackground';
import { canUsePasskeys } from '@/utils/webauthn';

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
        setTurnstileToken,
    } = useLoginForm();
    const {
        isLoading: isPasskeyLoading,
        error: passkeyError,
        banInfo: passkeyBanInfo,
        resetBan: resetPasskeyBan,
        loginWithPasskey,
    } = useLoginWithPasskey();
    const {
        login: recoveryLogin,
        setLogin: setRecoveryLogin,
        recoveryKey,
        setRecoveryKey,
        setTurnstileToken: setRecoveryTurnstileToken,
        isLoading: isRecoveryLoading,
        error: recoveryError,
        banInfo: recoveryBanInfo,
        resetBan: resetRecoveryBan,
        isFormValid: isRecoveryFormValid,
        handleSubmit: handleRecoverySubmit,
    } = useLoginWithRecoveryKey();
    const [showRecoveryKeyForm, setShowRecoveryKeyForm] = useState(false);

    if (isAuthenticated) return <Navigate replace to="/chat/@me" />;

    const activeBanInfo = banInfo ?? passkeyBanInfo ?? recoveryBanInfo;
    if (activeBanInfo !== null) {
        return (
            <BannedScreen
                expirationTimestamp={activeBanInfo.expirationTimestamp}
                reason={activeBanInfo.reason}
                onLogout={(): void => {
                    resetBan();
                    resetPasskeyBan();
                    resetRecoveryBan();
                }}
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

                {showRecoveryKeyForm ? (
                    <form
                        className="space-y-md"
                        onSubmit={(e): undefined =>
                            void handleRecoverySubmit(e)
                        }
                    >
                        <InputWrapper>
                            <Input
                                autoComplete="username"
                                className="bg-background/50"
                                name="email"
                                placeholder="E-mail"
                                type="text"
                                value={recoveryLogin}
                                onChange={(e): void => {
                                    setRecoveryLogin(e.target.value);
                                }}
                            />
                        </InputWrapper>
                        <InputWrapper>
                            <Input
                                className="bg-background/50"
                                placeholder="Recovery key (XXXX-XXXX)"
                                type="text"
                                value={recoveryKey}
                                onChange={(e): void => {
                                    setRecoveryKey(
                                        e.target.value
                                            .toUpperCase()
                                            .replaceAll(/\s+/g, ''),
                                    );
                                }}
                            />
                        </InputWrapper>
                        <div className="flex justify-end text-sm">
                            <button
                                className="text-muted-foreground hover:underline"
                                type="button"
                                onClick={(): void => {
                                    setShowRecoveryKeyForm(false);
                                }}
                            >
                                Back to sign in
                            </button>
                        </div>
                        <div className="flex justify-center">
                            <Turnstile
                                siteKey={
                                    import.meta.env.VITE_TURNSTILE_SITE_KEY ||
                                    ''
                                }
                                onSuccess={setRecoveryTurnstileToken}
                            />
                        </div>
                        <Button
                            className="flex w-full items-center justify-center gap-2 py-sm text-lg font-semibold"
                            disabled={!isRecoveryFormValid || isRecoveryLoading}
                            type="submit"
                            variant="normal"
                        >
                            {isRecoveryLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                'Use recovery key'
                            )}
                        </Button>
                    </form>
                ) : (
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
                                    <PasswordInput
                                        autoComplete="current-password"
                                        className="bg-background/50"
                                        name="password"
                                        placeholder="Password"
                                        value={password}
                                        onChange={(e): void => {
                                            setPassword(e.target.value);
                                        }}
                                    />
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
                        {!requiresTwoFactor && (
                            <div className="flex justify-center">
                                <Turnstile
                                    siteKey={
                                        import.meta.env
                                            .VITE_TURNSTILE_SITE_KEY || ''
                                    }
                                    onSuccess={setTurnstileToken}
                                />
                            </div>
                        )}
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
                )}

                {!showRecoveryKeyForm &&
                !requiresTwoFactor &&
                canUsePasskeys() ? (
                    <>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            <div className="h-px flex-1 bg-border-subtle" />
                            <span>OR</span>
                            <div className="h-px flex-1 bg-border-subtle" />
                        </div>
                        <Button
                            className="flex w-full items-center justify-center gap-2 py-sm text-lg font-semibold"
                            disabled={isPasskeyLoading}
                            type="button"
                            variant="normal"
                            onClick={(): undefined => void loginWithPasskey()}
                        >
                            {isPasskeyLoading ? (
                                <Loader2 className="animate-spin" size={20} />
                            ) : (
                                'Sign in with a passkey'
                            )}
                        </Button>
                        <div className="flex justify-center text-sm">
                            <button
                                className="text-muted-foreground hover:underline"
                                type="button"
                                onClick={(): void => {
                                    setShowRecoveryKeyForm(true);
                                }}
                            >
                                Lost access to your passkey? Use a recovery key
                            </button>
                        </div>
                    </>
                ) : null}

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

                <StatusMessage
                    message={passkeyError ?? recoveryError ?? status.message}
                    type={passkeyError || recoveryError ? 'error' : status.type}
                />
            </FormContent>
        </Box>
    );
};
