import React, { useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Eye, EyeOff, Loader2 } from 'lucide-react';

import { useRegisterForm } from '@/hooks/useRegisterForm';
import { FormContent } from '@/ui/components/auth/FormContent';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Input } from '@/ui/components/common/Input';
import { InputWrapper } from '@/ui/components/common/InputWrapper';
import { StatusMessage } from '@/ui/components/common/StatusMessage';
import { Text } from '@/ui/components/common/Text';
import { Box } from '@/ui/components/layout/Box';
import { DefaultBackground } from '@/ui/components/layout/DefaultBackground';

/**
 * @description Register page
 */
export const Register: React.FC = () => {
    const {
        login,
        setLogin,
        username,
        setUsername,
        password,
        setPassword,
        confirmPassword,
        setConfirmPassword,
        inviteToken,
        setInviteToken,
        status,
        errors,
        isLoading,
        isFormValid,
        handleSubmit,
    } = useRegisterForm();

    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    return (
        <Box className="relative flex min-h-screen w-full flex-col items-center justify-center overflow-hidden bg-background p-md">
            <DefaultBackground />

            {/* Register Box */}
            <FormContent>
                <Box className="space-y-sm text-center">
                    <Heading variant="page">Create an account</Heading>
                    <Text as="p">
                        Welcome! You'll need an invite token to join this chat
                        server.
                    </Text>
                </Box>

                <form
                    className="space-y-md"
                    onSubmit={(e) => void handleSubmit(e)}
                >
                    <InputWrapper>
                        <Input
                            autoComplete="username"
                            className="bg-background/50"
                            name="email"
                            placeholder="E-mail"
                            type="email"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                        />
                        <AnimatePresence>
                            {errors.login && (
                                <motion.small
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-1 block h-0 overflow-hidden text-xs text-red-400"
                                    exit={{ opacity: 0, height: 0 }}
                                    initial={{ opacity: 0, height: 0 }}
                                >
                                    {errors.login}
                                </motion.small>
                            )}
                        </AnimatePresence>
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            autoComplete="nickname"
                            className="bg-background/50"
                            name="username"
                            placeholder="Username (display name)"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <AnimatePresence>
                            {errors.username && (
                                <motion.small
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-1 block h-0 overflow-hidden text-xs text-red-400"
                                    exit={{ opacity: 0, height: 0 }}
                                    initial={{ opacity: 0, height: 0 }}
                                >
                                    {errors.username}
                                </motion.small>
                            )}
                        </AnimatePresence>
                    </InputWrapper>
                    <InputWrapper>
                        <div className="relative">
                            <Input
                                autoComplete="new-password"
                                className="bg-background/50 pr-10"
                                name="password"
                                placeholder="Password"
                                type={showPassword ? 'text' : 'password'}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
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
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                        <AnimatePresence>
                            {errors.password && (
                                <motion.small
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-1 block h-0 overflow-hidden text-xs text-red-400"
                                    exit={{ opacity: 0, height: 0 }}
                                    initial={{ opacity: 0, height: 0 }}
                                >
                                    {errors.password}
                                </motion.small>
                            )}
                        </AnimatePresence>
                    </InputWrapper>
                    <InputWrapper>
                        <div className="relative">
                            <Input
                                autoComplete="new-password"
                                className="bg-background/50 pr-10"
                                name="confirmPassword"
                                placeholder="Confirm Password"
                                type={showConfirmPassword ? 'text' : 'password'}
                                value={confirmPassword}
                                onChange={(e) =>
                                    setConfirmPassword(e.target.value)
                                }
                            />
                            <button
                                aria-label={
                                    showConfirmPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                                className="absolute top-1/2 right-3 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                                title={
                                    showConfirmPassword
                                        ? 'Hide password'
                                        : 'Show password'
                                }
                                type="button"
                                onClick={() =>
                                    setShowConfirmPassword(!showConfirmPassword)
                                }
                            >
                                {showConfirmPassword ? (
                                    <EyeOff size={18} />
                                ) : (
                                    <Eye size={18} />
                                )}
                            </button>
                        </div>
                        <AnimatePresence>
                            {errors.confirmPassword && (
                                <motion.small
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-1 block h-0 overflow-hidden text-xs text-red-400"
                                    exit={{ opacity: 0, height: 0 }}
                                    initial={{ opacity: 0, height: 0 }}
                                >
                                    {errors.confirmPassword}
                                </motion.small>
                            )}
                        </AnimatePresence>
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            className="bg-background/50"
                            placeholder="Invite Token"
                            type="text"
                            value={inviteToken}
                            onChange={(e) => setInviteToken(e.target.value)}
                        />
                        <AnimatePresence>
                            {errors.inviteToken && (
                                <motion.small
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="mt-1 block h-0 overflow-hidden text-xs text-red-400"
                                    exit={{ opacity: 0, height: 0 }}
                                    initial={{ opacity: 0, height: 0 }}
                                >
                                    {errors.inviteToken}
                                </motion.small>
                            )}
                        </AnimatePresence>
                    </InputWrapper>
                    <Button
                        className="flex h-12 w-full items-center justify-center gap-2 py-sm text-lg font-semibold"
                        disabled={isLoading || !isFormValid}
                        type="submit"
                        variant="normal"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" size={20} />
                        ) : (
                            'Register'
                        )}
                    </Button>
                </form>

                <StatusMessage message={status.message} type={status.type} />
            </FormContent>
        </Box>
    );
};
