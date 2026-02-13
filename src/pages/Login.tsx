import React from 'react';

import { Link } from 'react-router-dom';

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
    const {
        loginInput,
        setLoginInput,
        password,
        setPassword,
        status,
        handleSubmit,
    } = useLoginForm();

    return (
        <Box className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden p-md">
            <DefaultBackground />

            {/* Login Box */}
            <FormContent>
                <Box className="text-center space-y-sm">
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
                        <Input
                            className="bg-background/50"
                            placeholder="Login"
                            type="text"
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value)}
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
                    <div className="text-right">
                        <Link
                            className="text-sm text-primary hover:underline"
                            to="/forgot-password"
                        >
                            Forgot Password?
                        </Link>
                    </div>
                    <Button
                        className="w-full py-sm text-lg font-semibold"
                        type="submit"
                        variant="normal"
                    >
                        There we go!
                    </Button>
                </form>

                <StatusMessage message={status.message} type={status.type} />
            </FormContent>
        </Box>
    );
};
