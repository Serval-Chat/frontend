import { useState } from 'react';

import type { User } from '@/api/users/users.types';
import { usePasswordless } from '@/hooks/settings/usePasswordless';
import { Button } from '@/ui/components/common/Button';
import { Modal } from '@/ui/components/common/Modal';
import { PasswordInput } from '@/ui/components/common/PasswordInput';
import { Pill } from '@/ui/components/common/Pill';
import { Text } from '@/ui/components/common/Text';
import { canUsePasskeys } from '@/utils/webauthn';

interface PasswordlessSettingsProps {
    user: User;
}

export const PasswordlessSettings = ({
    user,
}: PasswordlessSettingsProps): React.ReactNode => {
    const {
        isEnabling,
        isRegenerating,
        recoveryKeys,
        enable,
        regenerateRecoveryKeys,
        closeRecoveryKeysModal,
    } = usePasswordless();
    const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
    const [password, setPassword] = useState('');

    if (!canUsePasskeys()) return null;

    const closeConfirmModal = (): void => {
        setIsConfirmModalOpen(false);
        setPassword('');
    };

    const handleEnable = (): void => {
        void enable(password).then(closeConfirmModal);
    };

    return (
        <div className="space-y-4 rounded-lg border border-border-subtle bg-bg-subtle p-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Text weight="bold">Passwordless Sign-In</Text>
                        <Pill
                            variant={user.passwordless ? 'success' : 'neutral'}
                        >
                            {user.passwordless ? 'Enabled' : 'Not enabled'}
                        </Pill>
                    </div>
                    <Text size="xs" variant="muted">
                        {user.passwordless
                            ? 'Your password is removed. Sign in with a passkey, or a recovery key if you lose access to one.'
                            : 'Remove your password entirely and sign in only with a passkey, backed by one-time recovery keys.'}
                    </Text>
                </div>
                {user.passwordless ? (
                    <Button
                        loading={isRegenerating}
                        size="sm"
                        variant="normal"
                        onClick={(): void => {
                            void regenerateRecoveryKeys();
                        }}
                    >
                        Regenerate Recovery Keys
                    </Button>
                ) : (
                    <Button
                        size="sm"
                        variant="normal"
                        onClick={(): void => {
                            setIsConfirmModalOpen(true);
                        }}
                    >
                        Go Passwordless
                    </Button>
                )}
            </div>

            <Modal
                isOpen={isConfirmModalOpen}
                title="Go Passwordless"
                onClose={closeConfirmModal}
            >
                <div className="space-y-4">
                    <Text size="sm" variant="muted">
                        This removes your password entirely. You&apos;ll need a
                        passkey to sign in afterward, so make sure you have one
                        set up. Enter your current password to confirm.
                    </Text>
                    <PasswordInput
                        placeholder="Current password"
                        value={password}
                        onChange={(e): void => {
                            setPassword(e.target.value);
                        }}
                    />
                    <div className="flex justify-end">
                        <Button
                            disabled={!password}
                            loading={isEnabling}
                            variant="normal"
                            onClick={handleEnable}
                        >
                            Confirm
                        </Button>
                    </div>
                </div>
            </Modal>

            <Modal
                isOpen={recoveryKeys !== null}
                title="Recovery Keys"
                onClose={closeRecoveryKeysModal}
            >
                <div className="space-y-4">
                    <Text size="sm" variant="muted">
                        Save these codes now. Each works once to sign in if you
                        lose access to your passkeys. They are shown only once.
                    </Text>
                    <div className="grid grid-cols-2 gap-2 rounded-md border border-border-subtle p-3 font-mono text-sm">
                        {(recoveryKeys ?? []).map((key) => (
                            <div key={key}>{key}</div>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <Button
                            variant="normal"
                            onClick={closeRecoveryKeysModal}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
