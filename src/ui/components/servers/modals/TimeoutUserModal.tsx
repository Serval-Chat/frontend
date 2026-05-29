import { useState } from 'react';

import { Button } from '@/ui/components/common/Button';
import { Heading } from '@/ui/components/common/Heading';
import { Modal } from '@/ui/components/common/Modal';
import { Text } from '@/ui/components/common/Text';
import { TextArea } from '@/ui/components/common/TextArea';
import { UserProfilePicture } from '@/ui/components/common/UserProfilePicture';
import { Box } from '@/ui/components/layout/Box';
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
    { label: '1 Day', value: 86400 },
    { label: '1 Week', value: 604800 },
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
                            <button
                                className={cn(
                                    'flex h-10 items-center justify-center rounded border px-3 text-sm font-medium transition-colors',
                                    selectedDuration === d.value
                                        ? 'border-primary bg-primary/10 text-primary'
                                        : 'border-border-subtle bg-bg-secondary text-muted-foreground hover:bg-bg-subtle hover:text-foreground',
                                )}
                                key={d.value}
                                type="button"
                                onClick={(): void =>
                                    setSelectedDuration(d.value)
                                }
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>
                </Box>

                <Box className="space-y-2">
                    <label
                        className="text-xs font-bold tracking-wider text-muted-foreground uppercase"
                        htmlFor="timeout-reason"
                    >
                        Reason for timeout
                    </label>
                    <TextArea
                        className="min-h-[80px] bg-bg-secondary"
                        id="timeout-reason"
                        placeholder="e.g. Spamming, inappropriate behavior..."
                        value={reason}
                        onChange={(e): void => setReason(e.target.value)}
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
