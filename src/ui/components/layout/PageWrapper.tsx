import React from 'react';

import { cn } from '@/utils/cn';

interface PageWrapperProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * @description Page wrapper with alignments and spacings
 */
export const PageWrapper: React.FC<PageWrapperProps> = ({
    children,
    className,
}) => {
    return (
        <div className={cn('relative z-10 text-center space-y-md', className)}>
            {children}
        </div>
    );
};
