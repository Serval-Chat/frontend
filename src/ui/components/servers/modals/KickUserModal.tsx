import React from 'react';

import { UserX } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';

interface KickUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    username: string;
    userAvatar?: string | null;
}

export const KickUserModal: React.FC<KickUserModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    username,
    userAvatar,
}) => (
    <Modal isOpen={isOpen} title="Kick Member" onClose={onClose}>
        <Box className="space-y-6">
            <Box className="flex flex-col items-center gap-4 py-4 text-center">
                <UserProfilePicture
                    size="xl"
                    src={userAvatar}
                    username={username}
                />
                <Box>
                    <Heading level={3}>Kick {username}?</Heading>
                    <Text className="text-[var(--color-muted-foreground)] mt-1">
                        Are you sure you want to kick{' '}
                        <strong>{username}</strong> from the server? They will
                        be able to rejoin with a new invite.
                    </Text>
                </Box>
            </Box>

            <Box className="flex justify-end gap-3 pt-4 border-t border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] -mx-6 -mb-6 p-6">
                <Button variant="ghost" onClick={onClose}>
                    Cancel
                </Button>
                <Button
                    className="bg-[var(--color-status-error)] hover:bg-[var(--color-status-error-hover)] text-white border-none"
                    onClick={() => {
                        onConfirm();
                        onClose();
                    }}
                >
                    <UserX className="w-4 h-4 mr-2" />
                    Kick Member
                </Button>
            </Box>
        </Box>
    </Modal>
);
