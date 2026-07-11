import React from 'react';

import { Check } from 'lucide-react';

import { cn } from '@/utils/cn';

interface BotTagProps {
    className?: string;
    label?: string;
    verified?: boolean;
}

/**
 * @description A consistent BOT tag for identifying bot users in the UI.
 */
export const BotTag = React.memo(
    ({ className, label = 'BOT', verified = false }: BotTagProps) => {
        const isWebhook = label === 'WEBHOOK';

        return (
            <span
                className={cn(
                    'ml-1 inline-flex items-center gap-0.5 rounded px-1 py-0.5 text-[10px] leading-none font-bold uppercase select-none',
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
                {verified && !isWebhook ? (
                    <Check aria-label="Verified bot" size={9} strokeWidth={3} />
                ) : null}
                {label}
            </span>
        );
    },
);

BotTag.displayName = 'BotTag';
