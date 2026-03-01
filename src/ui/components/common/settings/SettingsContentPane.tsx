import React from 'react';

import { cn } from '@/utils/cn';

interface SettingsContentPaneProps {
    children: React.ReactNode;
    maxWidthClass?: string;
}

export const SettingsContentPane: React.FC<SettingsContentPaneProps> = ({
    children,
    maxWidthClass = 'max-w-4xl',
}) => (
    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-[var(--color-bg-secondary)] scrollbar-track-transparent p-12">
        <div className={cn('mx-auto h-full', maxWidthClass)}>{children}</div>
    </div>
);
