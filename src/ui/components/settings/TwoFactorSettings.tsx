import type { User } from '@/api/users/users.types';
import { useTwoFactor } from '@/hooks/settings/useTwoFactor';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';

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
        startSetup,
        confirmSetup,
        regenerateBackupCodes,
        disable,
    } = useTwoFactor();

    return (
        <>
            <div className="space-y-4 rounded-lg border border-border-subtle bg-bg-subtle p-6">
                <div className="flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <Text weight="bold">Two-Factor Authentication</Text>
                        <Text size="xs" variant="muted">
                            {user.totpEnabled
                                ? '2FA is currently enabled.'
                                : 'Add an extra security layer to your account.'}
                        </Text>
                    </div>
                    {user.totpEnabled ? null : (
                        <Button
                            loading={isLoading}
                            size="sm"
                            variant="normal"
                            onClick={(): undefined => void startSetup()}
                        >
                            Set Up 2FA
                        </Button>
                    )}
                </div>

                {!user.totpEnabled && qrDataUrl ? (
                    <div className="space-y-3 rounded-md border border-border-subtle p-4">
                        <div className="flex justify-center">
                            <img
                                alt="TOTP QR code"
                                className="h-56 w-56 rounded-md bg-white p-2"
                                src={qrDataUrl}
                            />
                        </div>
                        <Text size="xs" variant="muted">
                            If scanning fails, copy this URI into your
                            authenticator app:
                        </Text>
                        <Input readOnly type="text" value={setupUri} />
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
                ) : null}

                {user.totpEnabled ? (
                    <div className="space-y-3 rounded-md border border-border-subtle p-4">
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
                isOpen={isBackupModalOpen}
                title="Backup Codes"
                onClose={closeBackupModal}
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
                        <Button variant="normal" onClick={closeBackupModal}>
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>
        </>
    );
};
