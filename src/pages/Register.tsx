import React from 'react';
import { Input } from '@/ui/components/Input';
import { Button } from '@/ui/components/Button';
import { DefaultBackground } from '@/ui/components/DefaultBackground';
import { StatusMessage } from '@/ui/components/StatusMessage';
import { useRegisterForm } from '@/hooks/useRegisterForm';

/**
 * @description Register page for Serchat
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
            <div className="relative z-10 w-full max-w-110 p-lg bg-bg-subtle/50 backdrop-blur-xl border border-border-subtle rounded-lg shadow-lg space-y-xl flex-shrink-0">
                <div className="text-center space-y-sm">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        Create an account
                    </h1>
                    <p className="text-muted-foreground">
                        Welcome! You'll need an invite token to join this chat
                        server.
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-md">
                    <div className="space-y-xs">
                        <Input
                            type="text"
                            placeholder="Login"
                            value={login}
                            onChange={(e) => setLogin(e.target.value)}
                            className="bg-background/50"
                        />
                    </div>
                    <div className="space-y-xs">
                        <Input
                            type="text"
                            placeholder="Username (display name)"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            className="bg-background/50"
                        />
                    </div>
                    <div className="space-y-xs">
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-background/50"
                        />
                    </div>
                    <div className="space-y-xs">
                        <Input
                            type="text"
                            placeholder="Invite Token"
                            value={inviteToken}
                            onChange={(e) => setInviteToken(e.target.value)}
                            className="bg-background/50"
                        />
                    </div>
                    <Button
                        type="submit"
                        buttonType="normal"
                        className="w-full py-sm text-lg font-semibold"
                    >
                        Register
                    </Button>
                </form>

                <StatusMessage message={status.message} type={status.type} />
            </div>
        </div>
    );
};

export default Register;
