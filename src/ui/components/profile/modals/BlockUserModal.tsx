import React, { useState } from 'react';

import type { BlockProfile } from '@/api/blocks/blocks.queries';
import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';

export interface BlockUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (profileId: string) => void;
    username: string;
    userAvatar?: string | null;
    profiles: BlockProfile[];
}

export const BlockUserModal: React.FC<BlockUserModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    username,
    userAvatar,
    profiles,
}) => {
    const [selectedProfileId, setSelectedProfileId] = useState<string>(
        () => profiles[0]?.id || '',
    );

    if (
        profiles.length > 0 &&
        !profiles.some((p) => p.id === selectedProfileId)
    ) {
        setSelectedProfileId(profiles[0].id);
    }

    const handleConfirm = (): void => {
        if (selectedProfileId) {
            onConfirm(selectedProfileId);
            onClose();
        }
    };

    return (
        <Modal isOpen={isOpen} title="Block User" onClose={onClose}>
            <Box className="space-y-6">
                <Box className="flex items-center gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                    <UserProfilePicture
                        size="lg"
                        src={userAvatar}
                        username={username}
                    />
                    <Box className="min-w-0 flex-1">
                        <Heading className="truncate" level={3}>
                            Block {username}
                        </Heading>
                        <Text className="text-muted-foreground" size="sm">
                            This user will be restricted based on the block
                            profile you assign below.
                        </Text>
                    </Box>
                </Box>

                <Box className="space-y-2">
                    <label
                        className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        htmlFor="block-profile-select"
                    >
                        Select Blocking Profile
                    </label>
                    <select
                        className="w-full rounded-md border border-white/10 bg-bg-secondary px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
                        id="block-profile-select"
                        value={selectedProfileId}
                        onChange={(e) => setSelectedProfileId(e.target.value)}
                    >
                        {profiles.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </select>
                </Box>

                <Box className="-mx-6 -mb-6 flex justify-end gap-3 border-t border-border-subtle bg-bg-subtle p-6 pt-4">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        disabled={!selectedProfileId}
                        variant="danger"
                        onClick={handleConfirm}
                    >
                        Block User
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};
