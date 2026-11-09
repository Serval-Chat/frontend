import React from 'react';

import { Check } from 'lucide-react';

import type { ManualUserStatus } from '@/features/users/hooks/useSelfStatus';
import { Popover } from '@/ui/primitives/Popover';
import { Box } from '@/ui/primitives/Box';
import { Pressable } from '@/ui/primitives/Pressable';
import { UserProfileStatusIndicator } from '@/features/users/UserProfileStatusIndicator';
import { Text } from '@/ui/primitives/Text';

interface StatusPickerProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement | null>;
    currentStatus: ManualUserStatus;
    onSelect: (status: ManualUserStatus) => void;
}

const STATUS_OPTIONS: { value: ManualUserStatus; label: string }[] = [
    { value: 'online', label: 'Online' },
    { value: 'idle', label: 'Idle' },
    { value: 'dnd', label: 'Do Not Disturb' },
    { value: 'offline', label: 'Offline' },
];

export const StatusPicker = ({
    isOpen,
    onClose,
    triggerRef,
    currentStatus,
    onSelect,
}: StatusPickerProps) => (
    <Popover
        className="w-48 p-1"
        isOpen={isOpen}
        triggerRef={triggerRef}
        onClose={onClose}
    >
        {STATUS_OPTIONS.map((option) => (
            <Pressable
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-bg-secondary"
                key={option.label}
                onClick={(): void => {
                    onSelect(option.value);
                    onClose();
                }}
            >
                <Box className="relative h-6 w-6 shrink-0">
                    <UserProfileStatusIndicator
                        className="static"
                        size="xl"
                        status={option.value}
                    />
                </Box>
                <Text className="flex-1 truncate">{option.label}</Text>
                {currentStatus === option.value ? (
                    <Check className="shrink-0 text-primary" size={14} />
                ) : null}
            </Pressable>
        ))}
    </Popover>
);
