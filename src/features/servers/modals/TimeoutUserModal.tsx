import { useState } from 'react';

import { UserProfilePicture } from '@/features/users/UserProfilePicture';
import { Box } from '@/ui/primitives/Box';
import { Button } from '@/ui/primitives/Button';
import { Heading } from '@/ui/primitives/Heading';
import { Label } from '@/ui/primitives/Label';
import { Modal } from '@/ui/primitives/Modal';
import { Pressable } from '@/ui/primitives/Pressable';
import { Text } from '@/ui/primitives/Text';
import { TextArea } from '@/ui/primitives/TextArea';
import { cn } from '@/utils/cn';

interface TimeoutUserModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: (duration: number, reason: string) => void;
    username: string;
    userAvatar?: string | null;
}

const DURATIONS = [
    { label: '60 Seconds', value: 60 },
    { label: '5 Minutes', value: 300 },
    { label: '10 Minutes', value: 600 },
    { label: '1 Hour', value: 3600 },
    { label: '1 Day', value: 86_400 },
    { label: '1 Week', value: 604_800 },
];

export const TimeoutUserModal = ({
    isOpen,
    onClose,
    onConfirm,
    username,
    userAvatar,
}: TimeoutUserModalProps) => {
    const [reason, setReason] = useState('');
    const [selectedDuration, setSelectedDuration] = useState(300);

    const handleConfirm = (): void => {
        onConfirm(selectedDuration, reason);
        setReason('');
        onClose();
    };

    return (
        <Modal isOpen={isOpen} title="Timeout Member" onClose={onClose}>
            <Box className="space-y-6">
                <Box className="flex items-center gap-4 rounded-lg border border-border-subtle bg-bg-subtle p-4">
                    <UserProfilePicture
                        size="lg"
                        src={userAvatar}
                        username={username}
                    />
                    <Box className="min-w-0 flex-1">
                        <Heading className="truncate" level={3}>
                            Timeout {username}
                        </Heading>
                        <Text className="text-muted-foreground" size="sm">
                            This member will be unable to send messages or add
                            reactions for the selected duration.
                        </Text>
                    </Box>
                </Box>

                <Box className="space-y-3">
                    <Text className="text-xs font-bold tracking-wider text-muted-foreground uppercase">
                        Duration
                    </Text>
                    <div className="grid grid-cols-2 gap-2">
                        {DURATIONS.map((d) => (
                            <Pressable
                                className={cn(
                                    'flex h-10 items-center justify-center rounded border px-3 text-sm font-medium transition-colors',
                                    selectedDuration === d.value
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border-subtle bg-bg-secondary text-muted-foreground hover:bg-bg-subtle hover:text-foreground',
                                )}
                                key={d.value}
                                onClick={(): void => {
                                    setSelectedDuration(d.value);
                                }}
                            >
                                {d.label}
                            </Pressable>
                        ))}
                    </div>
                </Box>

                <Box className="space-y-2">
                    <Label htmlFor="timeout-reason">Reason for timeout</Label>
                    <TextArea
                        className="min-h-[80px] bg-bg-secondary"
                        id="timeout-reason"
                        placeholder="e.g. Spamming, inappropriate behavior..."
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
                        Timeout Member
                    </Button>
                </Box>
            </Box>
        </Modal>
    );
};
