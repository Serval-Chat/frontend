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
    ({ className, label = 'BOT' }: BotTagProps) => {
        const isWebhook = label === 'WEBHOOK';

        return (
            <span
                className={cn(
                    'ml-1 inline-flex items-center rounded px-1 py-0.5 text-[10px] leading-none font-bold uppercase select-none',
                    className,
                )}
                style={{
                    backgroundColor: isWebhook
                        ? 'var(--webhook-tag-bg, var(--primary))'
                        : 'var(--bot-tag-bg, var(--primary))',
                    color: isWebhook
                        ? 'var(--webhook-tag-text, #ffffff)'
                        : 'var(--bot-tag-text, #ffffff)',
                }}
            >
                {label}
            </span>
        );
    },
);

BotTag.displayName = 'BotTag';
