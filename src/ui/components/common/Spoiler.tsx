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
export const Spoiler: React.FC<SpoilerProps> = ({ children, className }) => {
    const [isRevealed, setIsRevealed] = useState(false);

    return (
        <Box
            as="span"
            className={cn(
                'inline-block rounded px-1 transition-colors cursor-pointer',
                isRevealed
                    ? 'bg-[var(--color-bg-secondary)]'
                    : 'bg-[var(--color-background)] hover:brightness-110 select-none',
                className
            )}
            onClick={() => setIsRevealed(true)}
        >
            <Box
                as="span"
                className={cn(
                    'transition-opacity duration-200',
                    isRevealed ? 'opacity-100' : 'opacity-0'
                )}
            >
                {children}
            </Box>
        </Box>
    );
};
