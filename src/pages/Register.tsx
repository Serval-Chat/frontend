import { AnimatePresence, motion } from 'framer-motion';
import { Loader2 } from 'lucide-react';

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
        inviteToken,
        setInviteToken,
        status,
        errors,
        isLoading,
        handleSubmit,
    } = useRegisterForm();

    return (
        <Box className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden p-md">
            <DefaultBackground />

            {/* Register Box */}
            <FormContent>
                <Box className="text-center space-y-sm">
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
                            className="bg-background/50"
                            placeholder="Login"
                            type="text"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                        />
                        <AnimatePresence>
                            {errors.login && (
                                <motion.small
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="text-red-400 text-xs mt-1 block h-0 overflow-hidden"
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
                            className="bg-background/50"
                            placeholder="Username (display name)"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                        <AnimatePresence>
                            {errors.username && (
                                <motion.small
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="text-red-400 text-xs mt-1 block h-0 overflow-hidden"
                                    exit={{ opacity: 0, height: 0 }}
                                    initial={{ opacity: 0, height: 0 }}
                                >
                                    {errors.username}
                                </motion.small>
                            )}
                        </AnimatePresence>
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            className="bg-background/50"
                            placeholder="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                        <AnimatePresence>
                            {errors.password && (
                                <motion.small
                                    animate={{ opacity: 1, height: 'auto' }}
                                    className="text-red-400 text-xs mt-1 block h-0 overflow-hidden"
                                    exit={{ opacity: 0, height: 0 }}
                                    initial={{ opacity: 0, height: 0 }}
                                >
                                    {errors.password}
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
                                    className="text-red-400 text-xs mt-1 block h-0 overflow-hidden"
                                    exit={{ opacity: 0, height: 0 }}
                                    initial={{ opacity: 0, height: 0 }}
                                >
                                    {errors.inviteToken}
                                </motion.small>
                            )}
                        </AnimatePresence>
                    </InputWrapper>
                    <Button
                        className="w-full py-sm text-lg font-semibold h-12 flex items-center justify-center gap-2"
                        disabled={isLoading}
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
