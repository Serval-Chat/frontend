import React from 'react';

import { Check } from 'lucide-react';

import type { ManualUserStatus } from '@/hooks/useSelfStatus';
import { Popover } from '@/ui/components/common/Popover';
import { Box } from '@/ui/components/layout/Box';
import { UserProfileStatusIndicator } from '@/ui/components/common/UserProfileStatusIndicator';

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
            <button
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm text-foreground transition-colors hover:bg-bg-secondary"
                key={option.label}
                type="button"
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
                <span className="flex-1 truncate">{option.label}</span>
                {currentStatus === option.value ? (
                    <Check className="shrink-0 text-primary" size={14} />
                ) : null}
            </button>
        ))}
    </Popover>
);
