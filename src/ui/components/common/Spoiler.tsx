import React, { useState } from 'react';

import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

export const SPOILER_PILL_CLASSES = 'rounded px-1 bg-spoiler';

interface SpoilerProps {
    children: React.ReactNode;
    className?: string;
    alwaysRevealed?: boolean;
}

/**
 * @description A spoiler element. Shows its content on click
 */
export const Spoiler = ({
    children,
    className,
    alwaysRevealed = false,
}: SpoilerProps) => {
    const [isRevealed, setIsRevealed] = useState(false);
    const showContent = alwaysRevealed || isRevealed;

    return (
        <Box
            as="span"
            className={cn(
                'inline-block transition-colors',
                alwaysRevealed && SPOILER_PILL_CLASSES,
                !alwaysRevealed &&
                    (isRevealed
                        ? 'cursor-pointer rounded bg-spoiler-reveal px-1'
                        : `cursor-pointer ${SPOILER_PILL_CLASSES} select-none hover:opacity-80`),
                className,
            )}
            onClick={
                alwaysRevealed
                    ? undefined
                    : (): void => {
                          setIsRevealed(true);
                      }
            }
        >
            <Box
                as="span"
                className={cn(
                    'transition-opacity duration-200',
                    showContent ? 'opacity-100' : 'opacity-0',
                )}
            >
                {children}
            </Box>
        </Box>
    );
};
