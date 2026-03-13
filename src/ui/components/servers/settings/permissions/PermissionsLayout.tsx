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
    <div className="flex h-full items-center justify-center text-muted-foreground">
        {message}
    </div>
);

export const EditorLayout: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => (
    <div className="flex h-full flex-1 flex-col overflow-hidden bg-background md:flex-row">
        {children}
    </div>
);

export const EditorPanel: React.FC<{
    children: React.ReactNode;
    isMobileListOpen?: boolean;
}> = ({ children, isMobileListOpen = false }) => (
    <div
        className={cn(
            'relative flex-1 overflow-y-auto p-8',
            isMobileListOpen ? 'hidden md:block' : 'block',
        )}
    >
        <div className="mx-auto max-w-2xl space-y-8 pb-24">{children}</div>
    </div>
);

export const RolesSidebar: React.FC<{
    children: React.ReactNode;
    isMobileListOpen?: boolean;
}> = ({ children, isMobileListOpen = true }) => (
    <aside
        className={cn(
            'order-first flex-shrink-0 overflow-y-auto border-l border-border-subtle bg-bg-secondary md:order-last',
            isMobileListOpen ? 'w-full md:w-64' : 'hidden md:block md:w-64',
        )}
    >
        <div className="space-y-4 p-4">{children}</div>
    </aside>
);
