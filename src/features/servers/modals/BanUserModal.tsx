import { useState } from 'react';

import { UserProfilePicture } from '@/features/users/UserProfilePicture';
import { Box } from '@/ui/primitives/Box';
import { Button } from '@/ui/primitives/Button';
import { Heading } from '@/ui/primitives/Heading';
import { Label } from '@/ui/primitives/Label';
import { Modal } from '@/ui/primitives/Modal';
import { Slider } from '@/ui/primitives/Slider';
import { Text } from '@/ui/primitives/Text';
import { TextArea } from '@/ui/primitives/TextArea';

interface BanUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (reason: string, deleteMessageDuration?: string) => void;
    username: string;
    userAvatar?: string | null;
}

const DELETE_DURATIONS = [
    'None',
    '1 Hour',
    '2 Hours',
    '3 Hours',
    '6 Hours',
    '12 Hours',
    '24 Hours',
    '48 Hours',
    '72 Hours',
    'All Time',
];

const DELETE_DURATION_VALUES = [
    '',
    '1h',
    '2h',
    '3h',
    '6h',
    '12h',
    '24h',
    '48h',
    '72h',
    'all',
];

export const BanUserModal = ({
    isOpen,
    onClose,
    onConfirm,
    username,
    userAvatar,
}: BanUserModalProps) => {
    const [reason, setReason] = useState('');
    const [deleteIndex, setDeleteIndex] = useState(0);

    const handleConfirm = (): void => {
        onConfirm(reason, DELETE_DURATION_VALUES[deleteIndex] || undefined);
        setReason('');
        setDeleteIndex(0);
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

                <Box className="space-y-3">
                    <Text className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Delete Message History
                    </Text>
                    <Box className="space-y-2">
                        <Slider
                            aria-label="Delete message history"
                            max={9}
                            min={0}
                            value={deleteIndex}
                            onValueChange={(v): void => {
                                setDeleteIndex(v);
                            }}
                        />
                        <Text
                            className="text-center text-sm font-medium text-foreground"
                            size="sm"
                        >
                            {DELETE_DURATIONS[deleteIndex]}
                        </Text>
                    </Box>
                </Box>

                <Box className="space-y-2">
                    <Label htmlFor="ban-reason">Reason for ban</Label>
                    <TextArea
                        className="min-h-[100px] bg-bg-secondary"
                        id="ban-reason"
                        placeholder="e.g. Breaking server rules, spamming..."
                        value={reason}
                        onChange={(e): void => {
                            setReason(e.target.value);
                        }}
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
