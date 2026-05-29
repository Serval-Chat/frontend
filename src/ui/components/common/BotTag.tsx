import React from 'react';

import { cn } from '@/utils/cn';

interface BotTagProps {
    className?: string;
    label?: string;
}

/**
 * @description A consistent BOT tag for identifying bot users in the UI.
 */
export const BotTag = React.memo(
    ({ className, label = 'BOT' }: BotTagProps) => (
        <span
            className={cn(
                'ml-1 inline-flex items-center rounded bg-primary px-1 py-0.5 text-[10px] leading-none font-bold text-white uppercase select-none',
                className,
            )}
        >
            {label}
        </span>
    ),
);

BotTag.displayName = 'BotTag';
