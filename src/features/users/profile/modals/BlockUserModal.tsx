import { useState } from 'react';

import type { BlockProfile } from '@/api/blocks/blocks.queries';
import { UserProfilePicture } from '@/features/users/UserProfilePicture';
import { Box } from '@/ui/primitives/Box';
import { Button } from '@/ui/primitives/Button';
import { Heading } from '@/ui/primitives/Heading';
import { Label } from '@/ui/primitives/Label';
import { Modal } from '@/ui/primitives/Modal';
import { Select } from '@/ui/primitives/Select';
import { Text } from '@/ui/primitives/Text';

export interface BlockUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (profileId: string) => void;
    username: string;
    userAvatar?: string | null;
    profiles: BlockProfile[];
}

export const BlockUserModal = ({
    isOpen,
    onClose,
    onConfirm,
    username,
    userAvatar,
    profiles,
}: BlockUserModalProps) => {
    const [selectedProfileId, setSelectedProfileId] = useState<string>(
        (): string => profiles[0]?.id ?? '',
    );

    if (
        profiles.length > 0 &&
        !profiles.some((p): boolean => p.id === selectedProfileId)
    ) {
        const firstProfile = profiles[0];
        if (firstProfile) {
            setSelectedProfileId(firstProfile.id);
        }
    }

    const handleConfirm = (): void => {
        if (selectedProfileId !== '') {
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
                    <Label htmlFor="block-profile-select">
                        Select Blocking Profile
                    </Label>
                    <Select
                        id="block-profile-select"
                        value={selectedProfileId}
                        variant="secondary"
                        onChange={(e): void => {
                            setSelectedProfileId(e.target.value);
                        }}
                    >
                        {profiles.map((p) => (
                            <option key={p.id} value={p.id}>
                                {p.name}
                            </option>
                        ))}
                    </Select>
                </Box>

                <Box className="-mx-6 -mb-6 flex justify-end gap-3 border-t border-border-subtle bg-bg-subtle p-6 pt-4">
                    <Button variant="ghost" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        disabled={selectedProfileId === ''}
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
