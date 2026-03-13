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
                <Box className="flex items-center gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                    <UserProfilePicture
                        size="lg"
                        src={userAvatar}
                        username={username}
                    />
                    <Box className="min-w-0 flex-1">
                        <Heading className="truncate" level={3}>
                            Ban {username}
                        </Heading>
                        <Text className="text-muted-foreground" size="sm">
                            This user will be permanently removed and unable to
                            return unless unbanned.
                        </Text>
                    </Box>
                </Box>

                <Box className="space-y-2">
                    <label
                        className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        htmlFor="ban-reason"
                    >
                        Reason for ban
                    </label>
                    <TextArea
                        className="min-h-[100px] bg-bg-secondary"
                        id="ban-reason"
                        placeholder="e.g. Breaking server rules, spamming..."
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                    />
                </Box>

                <Box className="-mx-6 -mb-6 flex justify-end gap-3 border-t border-border-subtle bg-bg-subtle p-6 pt-4">
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
