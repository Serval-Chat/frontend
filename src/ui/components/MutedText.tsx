import React from 'react';
import { cn } from '@/utils/cn';

interface MutedTextProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * @description muted text component
 */
export const MutedText: React.FC<MutedTextProps> = ({
    children,
    className,
}) => {
    return (
        <p className={cn('text-sm text-muted-foreground/80', className)}>
            {children}
        </p>
    );
};
