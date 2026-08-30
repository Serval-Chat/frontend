import { useState } from 'react';

import { KeyRound, Pencil, Trash2 } from 'lucide-react';

import { usePasskeys } from '@/hooks/settings/usePasskeys';
import { Button } from '@/ui/components/common/Button';
import { Input } from '@/ui/components/common/Input';
import { Modal } from '@/ui/components/common/Modal';
import { Pill } from '@/ui/components/common/Pill';
import { Text } from '@/ui/components/common/Text';
import { Timestamp } from '@/ui/components/common/Timestamp';
import { canUsePasskeys } from '@/utils/webauthn';

const toSeconds = (isoDate: string): number =>
    new Date(isoDate).getTime() / 1000;

export const PasskeySettings = (): React.ReactNode => {
    const {
        passkeys,
        isLoading,
        isRegistering,
        mutatingId,
        registerPasskey,
        renamePasskey,
        removePasskey,
    } = usePasskeys();
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newName, setNewName] = useState('');
    const [renamingId, setRenamingId] = useState<string | null>(null);
    const [renameValue, setRenameValue] = useState('');

    if (!canUsePasskeys()) return null;

    const closeAddModal = (): void => {
        setIsAddModalOpen(false);
        setNewName('');
    };

    const handleAdd = (): void => {
        void registerPasskey(newName.trim() || undefined).then(closeAddModal);
    };

    const startRename = (id: string, currentName: string): void => {
        setRenamingId(id);
        setRenameValue(currentName);
    };

    const confirmRename = (id: string): void => {
        void renamePasskey(id, renameValue.trim()).then((): void => {
            setRenamingId(null);
        });
    };

    return (
        <div className="space-y-4 rounded-lg border border-border-subtle bg-bg-subtle p-6">
            <div className="flex items-center justify-between gap-4">
                <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                        <Text weight="bold">Passkeys</Text>
                        <Pill
                            variant={
                                passkeys.length > 0 ? 'success' : 'neutral'
                            }
                        >
                            {passkeys.length}
                        </Pill>
                    </div>
                    <Text size="xs" variant="muted">
                        Sign in without a password using a fingerprint, face, or
                        security key.
                    </Text>
                </div>
                <Button
                    icon={KeyRound}
                    size="sm"
                    variant="normal"
                    onClick={(): void => {
                        setIsAddModalOpen(true);
                    }}
                >
                    Add Passkey
                </Button>
            </div>

            {!isLoading && passkeys.length === 0 ? (
                <Text size="xs" variant="muted">
                    No passkeys yet.
                </Text>
            ) : null}

            {passkeys.length > 0 ? (
                <div className="space-y-2 border-t border-border-subtle pt-4">
                    {passkeys.map((passkey) => (
                        <div
                            className="flex items-center justify-between gap-3 rounded-md border border-border-subtle bg-background p-3"
                            key={passkey.id}
                        >
                            <div className="min-w-0">
                                {renamingId === passkey.id ? (
                                    <div className="flex items-center gap-2">
                                        <Input
                                            size="sm"
                                            value={renameValue}
                                            onChange={(e): void => {
                                                setRenameValue(e.target.value);
                                            }}
                                            onKeyDown={(e): void => {
                                                if (e.key === 'Enter') {
                                                    confirmRename(passkey.id);
                                                }
                                                if (e.key === 'Escape') {
                                                    setRenamingId(null);
                                                }
                                            }}
                                        />
                                        <Button
                                            loading={mutatingId === passkey.id}
                                            size="sm"
                                            variant="normal"
                                            onClick={(): void => {
                                                confirmRename(passkey.id);
                                            }}
                                        >
                                            Save
                                        </Button>
                                    </div>
                                ) : (
                                    <>
                                        <Text
                                            className="truncate"
                                            size="sm"
                                            weight="bold"
                                        >
                                            {passkey.name}
                                        </Text>
                                        <div className="flex flex-wrap items-center gap-1 text-xs text-muted-foreground">
                                            <span>
                                                Added{' '}
                                                <Timestamp
                                                    flag="R"
                                                    timestamp={toSeconds(
                                                        passkey.createdAt,
                                                    )}
                                                />
                                            </span>
                                            <span>
                                                · last used{' '}
                                                {passkey.lastUsedAt ? (
                                                    <Timestamp
                                                        flag="R"
                                                        timestamp={toSeconds(
                                                            passkey.lastUsedAt,
                                                        )}
                                                    />
                                                ) : (
                                                    'never'
                                                )}
                                            </span>
                                        </div>
                                    </>
                                )}
                            </div>
                            {renamingId === passkey.id ? null : (
                                <div className="flex items-center gap-1">
                                    <Button
                                        icon={Pencil}
                                        size="sm"
                                        variant="ghost"
                                        onClick={(): void => {
                                            startRename(
                                                passkey.id,
                                                passkey.name,
                                            );
                                        }}
                                    >
                                        Rename
                                    </Button>
                                    <Button
                                        icon={Trash2}
                                        loading={mutatingId === passkey.id}
                                        size="sm"
                                        variant="ghost"
                                        onClick={(): void => {
                                            void removePasskey(passkey.id);
                                        }}
                                    >
                                        Remove
                                    </Button>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : null}

            <Modal
                isOpen={isAddModalOpen}
                title="Add a Passkey"
                onClose={closeAddModal}
            >
                <div className="space-y-4">
                    <Text size="sm" variant="muted">
                        Give it a nickname so you can recognize it later, then
                        follow your browser's prompt.
                    </Text>
                    <Input
                        placeholder="e.g. MacBook Touch ID"
                        value={newName}
                        onChange={(e): void => {
                            setNewName(e.target.value);
                        }}
                    />
                    <div className="flex justify-end">
                        <Button
                            loading={isRegistering}
                            variant="normal"
                            onClick={handleAdd}
                        >
                            Continue
                        </Button>
                    </div>
                </div>
            </Modal>
        </div>
    );
};
