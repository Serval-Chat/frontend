import React from 'react';

import { Text } from '@/ui/components/common/Text';
import { cn } from '@/utils/cn';

export const SectionLabel: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => (
    <Text
        className="mb-2"
        size="xs"
        tracking="wider"
        transform="uppercase"
        variant="muted"
        weight="bold"
    >
        {children}
    </Text>
);

export const EmptyState: React.FC<{ message: string }> = ({ message }) => (
    <div className="flex items-center justify-center h-full text-[var(--color-muted-foreground)]">
        {message}
    </div>
);

export const EditorLayout: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => (
    <div className="flex-1 flex flex-col md:flex-row h-full overflow-hidden bg-[var(--color-background)]">
        {children}
    </div>
);

export const EditorPanel: React.FC<{
    children: React.ReactNode;
    isMobileListOpen?: boolean;
}> = ({ children, isMobileListOpen = false }) => (
    <div
        className={cn(
            'flex-1 overflow-y-auto p-8 relative',
            isMobileListOpen ? 'hidden md:block' : 'block',
        )}
    >
        <div className="max-w-2xl mx-auto space-y-8 pb-24">{children}</div>
    </div>
);

export const RolesSidebar: React.FC<{
    children: React.ReactNode;
    isMobileListOpen?: boolean;
}> = ({ children, isMobileListOpen = true }) => (
    <aside
        className={cn(
            'border-l border-[var(--color-border-subtle)] bg-[var(--color-bg-secondary)] overflow-y-auto flex-shrink-0 order-first md:order-last',
            isMobileListOpen ? 'w-full md:w-64' : 'hidden md:block md:w-64',
        )}
    >
        <div className="p-4 space-y-4">{children}</div>
    </aside>
);
