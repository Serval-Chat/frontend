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
    <div className="scrollbar-thin scrollbar-thumb-bg-secondary scrollbar-track-transparent flex-1 overflow-y-auto p-12">
        <div className={cn('mx-auto h-full', maxWidthClass)}>{children}</div>
    </div>
);
