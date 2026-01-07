import React from 'react';
import { Input } from '@/ui/components/common/Input';
import { Button } from '@/ui/components/common/Button';
import { DefaultBackground } from '@/ui/components/layout/DefaultBackground';
import { StatusMessage } from '@/ui/components/common/StatusMessage';
import { Heading } from '@/ui/components/common/Heading';
import { NormalText } from '@/ui/components/common/NormalText';
import { FormContent } from '@/ui/components/auth/FormContent';
import { InputWrapper } from '@/ui/components/common/InputWrapper';
import { useRegisterForm } from '@/hooks/useRegisterForm';

/**
 * @description Register page
 */
const Register: React.FC = () => {
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
        <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background relative overflow-hidden p-md">
            <DefaultBackground />

            {/* Register Box */}
            <FormContent>
                <div className="text-center space-y-sm">
                    <Heading variant="page">Create an account</Heading>
                    <NormalText>
                        Welcome! You'll need an invite token to join this chat
                        server.
                    </NormalText>
                </div>

                <form onSubmit={handleSubmit} className="space-y-md">
                    <InputWrapper>
                        <Input
                            type="text"
                            placeholder="Login"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            className="bg-background/50"
                        />
                    </InputWrapper>
                    <InputWrapper>
                        <Input
                            type="text"
                            placeholder="Username (display name)"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
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
                    <InputWrapper>
                        <Input
                            type="text"
                            placeholder="Invite Token"
                            value={inviteToken}
                            onChange={(e) => setInviteToken(e.target.value)}
                            className="bg-background/50"
                        />
                    </InputWrapper>
                    <Button
                        type="submit"
                        variant="normal"
                        className="w-full py-sm text-lg font-semibold"
                    >
                        Register
                    </Button>
                </form>

                <StatusMessage message={status.message} type={status.type} />
            </FormContent>
        </div>
    );
};

export default Register;
