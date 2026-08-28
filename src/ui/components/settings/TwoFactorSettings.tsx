import { useState } from 'react';

import type { User } from '@/api/users/users.types';
import { useTwoFactor } from '@/hooks/settings/useTwoFactor';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { LoadingSpinner } from '@/ui/components/common/LoadingSpinner';
import { Modal } from '@/ui/components/common/Modal';
import { Pill } from '@/ui/components/common/Pill';
import { Text } from '@/ui/components/common/Text';
import { useToast } from '@/ui/components/common/Toast';

interface TwoFactorSettingsProps {
    user: User;
}

export const TwoFactorSettings = ({
    user,
}: TwoFactorSettingsProps): React.ReactNode => {
    const {
        isLoading,
        isConfirmLoading,
        isBackupModalOpen,
        setupUri,
        qrDataUrl,
        code,
        backupCode,
        showDisableBackupInput,
        backupCodes,
        setCode,
        setBackupCode,
        toggleDisableBackupInput,
        closeBackupModal,
        cancelSetup,
        startSetup,
        confirmSetup,
        regenerateBackupCodes,
        disable,
    } = useTwoFactor();
    const { showToast } = useToast();

    const [isSetupModalRequested, setIsSetupModalRequested] = useState(false);
    const isSetupModalOpen = isSetupModalRequested && !isBackupModalOpen;

    const handleStartSetup = (): void => {
        setIsSetupModalRequested(true);
        void startSetup();
    };

    const handleCloseSetupModal = (): void => {
        setIsSetupModalRequested(false);
        cancelSetup();
    };

    const handleCloseBackupModal = (): void => {
        setIsSetupModalRequested(false);
        closeBackupModal();
    };

    const handleCopySetupUri = (): void => {
        void navigator.clipboard.writeText(setupUri).then((): void => {
            showToast('URI copied to clipboard.', 'success');
        });
    };

    return (
        <>
            <div className="space-y-4 rounded-lg border border-border-subtle bg-bg-subtle p-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                            <Text weight="bold">Two-Factor Authentication</Text>
                            <Pill variant={user.totpEnabled ? 'success' : 'caution'}>
                                {user.totpEnabled ? 'Enabled' : 'Not enabled'}
                            </Pill>
                        </div>
                        <Text size="xs" variant="muted">
                            {user.totpEnabled
                                ? '2FA is currently enabled.'
                                : 'Add an extra security layer to your account.'}
                        </Text>
                    </div>
                    {user.totpEnabled ? null : (
                        <Button
                            size="sm"
                            variant="normal"
                            onClick={handleStartSetup}
                        >
                            Set Up 2FA
                        </Button>
                    )}
                </div>

                {user.totpEnabled ? (
                    <div className="space-y-3 border-t border-border-subtle pt-4">
                        <Text size="xs" variant="muted">
                            Enter an authenticator code to regenerate backup
                            codes.
                        </Text>
                        <div className="flex gap-2">
                            <Input
                                placeholder="6-digit code"
                                type="text"
                                value={code}
                                onChange={(e): void => {
                                    setCode(e.target.value);
                                }}
                            />
                            <Button
                                loading={isConfirmLoading}
                                size="sm"
                                variant="normal"
                                onClick={(): undefined =>
                                    void regenerateBackupCodes()
                                }
                            >
                                Regenerate
                            </Button>
                        </div>
                        <div className="border-t border-border-subtle pt-3">
                            <Text className="mb-2" size="xs" variant="muted">
                                Disable 2FA (requires confirmation)
                            </Text>
                            <div className="space-y-2">
                                <Input
                                    placeholder={
                                        showDisableBackupInput
                                            ? 'Backup code (XXXX-XXXX)'
                                            : '6-digit code'
                                    }
                                    type="text"
                                    value={
                                        showDisableBackupInput
                                            ? backupCode
                                            : code
                                    }
                                    onChange={(e): void => {
                                        if (showDisableBackupInput) {
                                            setBackupCode(e.target.value);
                                        } else {
                                            setCode(e.target.value);
                                        }
                                    }}
                                />
                                <div className="flex items-center justify-between">
                                    <button
                                        className="text-xs text-primary hover:underline"
                                        type="button"
                                        onClick={toggleDisableBackupInput}
                                    >
                                        {showDisableBackupInput
                                            ? 'Use authenticator code'
                                            : 'Use backup code'}
                                    </button>
                                    <Button
                                        loading={isConfirmLoading}
                                        size="sm"
                                        variant="danger"
                                        onClick={(): undefined =>
                                            void disable()
                                        }
                                    >
                                        Disable 2FA
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>

            <Modal
                isOpen={isSetupModalOpen}
                title="Set Up Two-Factor Authentication"
                onClose={handleCloseSetupModal}
            >
                {isLoading && !qrDataUrl ? (
                    <div className="flex min-h-[220px] items-center justify-center">
                        <LoadingSpinner />
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="flex justify-center">
                            <img
                                alt="TOTP QR code"
                                className="h-56 w-56 rounded-md bg-white p-2"
                                src={qrDataUrl}
                            />
                        </div>
                        <Text size="xs" variant="muted">
                            If scanning fails,{' '}
                            <button
                                className="font-medium text-primary hover:underline"
                                type="button"
                                onClick={handleCopySetupUri}
                            >
                                copy the setup URI
                            </button>{' '}
                            into your authenticator app instead.
                        </Text>
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter first 6-digit code"
                                type="text"
                                value={code}
                                onChange={(e): void => {
                                    setCode(e.target.value);
                                }}
                            />
                            <Button
                                loading={isConfirmLoading}
                                variant="normal"
                                onClick={(): undefined => void confirmSetup()}
                            >
                                Confirm
                            </Button>
                        </div>
                    </div>
                )}
            </Modal>

            <Modal
                isOpen={isBackupModalOpen}
                title="Backup Codes"
                onClose={handleCloseBackupModal}
            >
                <div className="space-y-4">
                    <Text size="sm" variant="muted">
                        Save these codes now. They are shown only once.
                    </Text>
                    <div className="grid grid-cols-2 gap-2 rounded-md border border-border-subtle p-3 font-mono text-sm">
                        {backupCodes.map((backupCodeValue) => (
                            <div key={backupCodeValue}>{backupCodeValue}</div>
                        ))}
                    </div>
                    <div className="flex justify-end">
                        <Button
                            variant="normal"
                            onClick={handleCloseBackupModal}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
