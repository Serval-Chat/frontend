import React from 'react';

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
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            className="bg-background/50"
                            placeholder="Username (display name)"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            className="bg-background/50"
                            placeholder="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            className="bg-background/50"
                            placeholder="Invite Token"
                            type="text"
                            value={inviteToken}
                            onChange={(e) => setInviteToken(e.target.value)}
                        />
                    </InputWrapper>
                    <Button
                        className="w-full py-sm text-lg font-semibold"
                        type="submit"
                        variant="normal"
                    >
                        Register
                    </Button>
                </form>

                <StatusMessage message={status.message} type={status.type} />
            </FormContent>
        </Box>
    );
};
