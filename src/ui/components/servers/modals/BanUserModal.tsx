import React, { useState } from 'react';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { TextArea } from '@/ui/components/common/TextArea';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';

interface BanUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string) => void;
    username: string;
    userAvatar?: string | null;
}

export const BanUserModal: React.FC<BanUserModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    username,
    userAvatar,
}) => {
    const [reason, setReason] = useState('');

    const handleConfirm = (): void => {
        onConfirm(reason);
        setReason('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} title="Ban User" onClose={onClose}>
            <Box className="space-y-6">
                <Box className="flex items-center gap-4 p-4 bg-[var(--color-bg-subtle)] rounded-lg border border-[var(--color-border-subtle)]">
                    <UserProfilePicture
                        size="lg"
                        src={userAvatar}
                        username={username}
                    />
                    <Box className="flex-1 min-w-0">
                        <Heading className="truncate" level={3}>
                            Ban {username}
                        </Heading>
                        <Text
                            className="text-[var(--color-muted-foreground)]"
                            size="sm"
                        >
                            This user will be permanently removed and unable to
                            return unless unbanned.
                        </Text>
                    </Box>
                </Box>

                <Box className="space-y-2">
                    <label
                        className="text-xs font-bold text-[var(--color-muted-foreground)] uppercase tracking-wider"
                        htmlFor="ban-reason"
                    >
                        Reason for ban
                    </label>
                    <TextArea
                        className="min-h-[100px] bg-[var(--color-bg-secondary)]"
                        id="ban-reason"
                        placeholder="e.g. Breaking server rules, spamming..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </Box>

                <Box className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] -mx-6 -mb-6 p-6">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleConfirm}>
                        Ban User
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};
