import React from 'react';
import { Input } from '@/ui/components/Input';
import { Button } from '@/ui/components/Button';
import { DefaultBackground } from '@/ui/components/DefaultBackground';
import { StatusMessage } from '@/ui/components/StatusMessage';
import { Heading } from '@/ui/components/Heading';
import { NormalText } from '@/ui/components/NormalText';
import { FormContent } from '@/ui/components/FormContent';
import { InputWrapper } from '@/ui/components/InputWrapper';
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
