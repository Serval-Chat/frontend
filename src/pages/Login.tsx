import React from 'react';
import { Input } from '@/ui/components/common/Input';
import { Button } from '@/ui/components/common/Button';
import { DefaultBackground } from '@/ui/components/layout/DefaultBackground';
import { StatusMessage } from '@/ui/components/common/StatusMessage';
import { Heading } from '@/ui/components/common/Heading';
import { NormalText } from '@/ui/components/common/NormalText';
import { MutedText } from '@/ui/components/common/MutedText';
import { FormContent } from '@/ui/components/auth/FormContent';
import { InputWrapper } from '@/ui/components/common/InputWrapper';
import { useLoginForm } from '@/hooks/useLoginForm';

/**
 * @description Login page
 */
const Login: React.FC = () => {
    const {
        loginInput,
        setLoginInput,
        password,
        setPassword,
        status,
        handleSubmit,
    } = useLoginForm();

    return (
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden p-md">
            <DefaultBackground />

            {/* Login Box */}
            <FormContent>
                <div className="text-center space-y-sm">
                    <Heading variant="page">HELLO!</Heading>
                    <NormalText>
                        If you see this, you need to log in to chat on this
                        server.
                    </NormalText>
                    <MutedText>
                        Not invited yet? Ask the owner (<b>catflare</b>).
                    </MutedText>
                    <NormalText>
                        Got your login info? Enter it below!
                    </NormalText>
                </div>

                <form onSubmit={handleSubmit} className="space-y-md">
                    <InputWrapper>
                        <Input
                            type="text"
                            placeholder="Login"
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value)}
                            className="bg-background/50"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-background/50"
                        />
                    </InputWrapper>
                    <Button
                        type="submit"
                        variant="normal"
                        className="w-full py-sm text-lg font-semibold"
                    >
                        There we go!
                    </Button>
                </form>

                <StatusMessage message={status.message} type={status.type} />
            </FormContent>
        </div>
    );
};

export default Login;
