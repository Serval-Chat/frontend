import React from 'react';
import { Input } from '@/ui/components/Input';
import { Button } from '@/ui/components/Button';
import { DefaultBackground } from '@/ui/components/DefaultBackground';
import { StatusMessage } from '@/ui/components/StatusMessage';
import { useLoginForm } from '@/hooks/useLoginForm';

/**
 * @description Login page for Serchat
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
            <div className="relative z-10 w-full max-w-110 p-lg bg-bg-subtle/50 backdrop-blur-xl border border-border-subtle rounded-lg shadow-lg space-y-xl flex-shrink-0">
                <div className="text-center space-y-sm">
                    <h1 className="text-3xl font-bold tracking-tight text-foreground">
                        HELLO!
                    </h1>
                    <p className="text-muted-foreground">
                        If you see this, you need to log in to chat on this
                        server.
                    </p>
                    <p className="text-sm text-muted-foreground/80">
                        Not invited yet? Ask the owner (<b>catflare</b>).
                    </p>
                    <p className="text-sm font-medium text-primary">
                        Got your login info? Enter it below!
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-md">
                    <div className="space-y-xs">
                        <Input
                            type="text"
                            placeholder="Login"
                            value={loginInput}
                            onChange={(e) => setLoginInput(e.target.value)}
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
                    <Button
                        type="submit"
                        buttonType="normal"
                        className="w-full py-sm text-lg font-semibold"
                    >
                        There we go!
                    </Button>
                </form>

                <StatusMessage message={status.message} type={status.type} />
            </div>
        </div>
    );
};

export default Login;
