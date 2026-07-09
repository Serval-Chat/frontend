import { useState } from 'react';

import type { User } from '@/api/users/users.types';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Text } from '@/ui/components/common/Text';

import { ChangeLoginModal } from './ChangeLoginModal';
import { ChangePasswordModal } from './ChangePasswordModal';
import { TwoFactorSettings } from './TwoFactorSettings';

interface SecuritySettingsProps {
    user: User;
}

export const SecuritySettings = ({
    user,
}: SecuritySettingsProps): React.ReactNode => {
    const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
    const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);

    return (
        <div className="border-t border-border-subtle pt-6">
            <Heading className="mb-4" level={4}>
                Password & Authentication
            </Heading>
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-6">
                    <div className="flex flex-col gap-1">
                        <Text weight="bold">E-mail</Text>
                        <Text size="xs" variant="muted">
                            Change your e-mail address
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
