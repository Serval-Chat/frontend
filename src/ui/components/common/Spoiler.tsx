import React, { useState } from 'react';

import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface SpoilerProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * @description A spoiler element. Shows its content on click
 */
export const Spoiler = ({ children, className }: SpoilerProps) => {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <Box
            as="span"
            className={cn(
                'inline-block cursor-pointer rounded px-1 transition-colors',
                isRevealed
                    ? 'bg-spoiler-reveal'
                    : 'bg-spoiler select-none hover:opacity-80',
                className,
            )}
            onClick={(): void => {
                setIsRevealed(true);
            }}
        >
            <Box
                as="span"
                className={cn(
                    'transition-opacity duration-200',
                    isRevealed ? 'opacity-100' : 'opacity-0',
                )}
            >
                {children}
            </Box>
        </Box>
    );
};
