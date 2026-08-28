import { useState } from 'react';

import { useMe } from '@/api/users/users.queries';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';

import { ChangeLoginModal } from './ChangeLoginModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { TwoFactorSettings } from './TwoFactorSettings';

const maskLogin = (login: string): string => {
    const atIndex = login.indexOf('@');
    if (atIndex <= 0) return login;

    const local = login.slice(0, atIndex);
    const domain = login.slice(atIndex);
    const visible = local.slice(0, Math.min(2, local.length));
    const maskLength = Math.max(local.length - visible.length, 3);
    return `${visible}${'*'.repeat(maskLength)}${domain}`;
};

export const SecuritySettings = (): React.ReactNode => {
    const { data: user } = useMe();
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    if (!user) return null;

    return (
        <div className="max-w-3xl">
            <Heading className="mb-1" level={3}>
                Authentication
            </Heading>
            <Text className="mb-4" size="sm" variant="muted">
                Manage your login e-mail, password, and two-factor
                authentication.
            </Text>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-6">
                    <div className="flex flex-col gap-1">
                        <Text weight="bold">E-mail</Text>
                        <Text size="xs" variant="muted">
                            {maskLogin(user.login!)}
                        </Text>
                    </div>
                    <Button
                        size="sm"
                        variant="normal"
                        onClick={(): void => {
                            setIsLoginModalOpen(true);
                        }}
                    >
                        Change E-mail
                    </Button>
                </div>
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-6">
                    <div className="flex flex-col gap-1">
                        <Text weight="bold">Password</Text>
                        <Text size="xs" variant="muted">
                            Please use a strong password (and I enforce it)
                        </Text>
                    </div>
                    <Button
                        size="sm"
                        variant="normal"
                        onClick={(): void => {
                            setIsPasswordModalOpen(true);
                        }}
                    >
                        Change Password
                    </Button>
                </div>
                <TwoFactorSettings user={user} />
            </div>

            <ChangeLoginModal
                isOpen={isLoginModalOpen}
                onClose={(): void => {
                    setIsLoginModalOpen(false);
                }}
            />

            <ChangePasswordModal
                isOpen={isPasswordModalOpen}
                onClose={(): void => {
                    setIsPasswordModalOpen(false);
                }}
            />
        </div>
    );
};
