import { type ReactNode, useState } from 'react';

import { KeyRound } from 'lucide-react';

import { useAdminResetPasswordless } from '@/hooks/admin/useAdminPasswordless';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';

interface AdminPasswordlessResetProps {
    userId: string;
    isPasswordless: boolean;
}

export const AdminPasswordlessReset = ({
    userId,
    isPasswordless,
}: AdminPasswordlessResetProps): ReactNode => {
    const { mutate: reset, isPending } = useAdminResetPasswordless();
    const [temporaryPassword, setTemporaryPassword] = useState<string | null>(
        null,
    );

    if (!isPasswordless) return null;

    const handleReset = (): void => {
        if (
            !globalThis.confirm(
                'Reset this passwordless account back to a temporary password? This revokes all of their active sessions.',
            )
        ) {
            return;
        }
        reset(userId, {
            onSuccess: (data): void => {
                setTemporaryPassword(data.temporaryPassword);
            },
        });
    };

    return (
        <div className="rounded-2xl border border-border-subtle bg-bg-subtle p-6">
            <Heading className="mb-4" level={3} variant="admin-sub">
                Passwordless Recovery
            </Heading>
            <div className="flex items-center justify-between gap-4">
                <Text size="sm" variant="muted">
                    This account is passwordless. If the user lost both their
                    passkey and recovery keys, reset it to a temporary password
                    so they can sign back in.
                </Text>
                <Button
                    icon={KeyRound}
                    loading={isPending}
                    size="sm"
                    variant="danger"
                    onClick={handleReset}
                >
                    Reset Account
                </Button>
            </div>

            <Modal
                isOpen={temporaryPassword !== null}
                title="Temporary Password"
                onClose={(): void => {
                    setTemporaryPassword(null);
                }}
            >
                <div className="space-y-4">
                    <Text size="sm" variant="muted">
                        Relay this to the user out-of-band. It&apos;s shown only
                        once — they should change it immediately after signing
                        in.
                    </Text>
                    <div className="rounded-md border border-border-subtle p-3 font-mono text-sm">
                        {temporaryPassword}
                    </div>
                    <div className="flex justify-end">
                        <Button
                            variant="normal"
                            onClick={(): void => {
                                setTemporaryPassword(null);
                            }}
                        >
                            Done
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
