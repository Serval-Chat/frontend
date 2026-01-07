import React from 'react';
import { cn } from '@/utils/cn';

interface NormalTextProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * @description Standard text
 */
export const NormalText: React.FC<NormalTextProps> = ({
    children,
    className,
}) => {
    return <p className={cn('text-foreground', className)}>{children}</p>;
};
