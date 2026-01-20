import React from 'react';

import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

interface LoadingSpinnerProps {
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

/**
 * @description A loading spinner
 */
export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
    className,
    size = 'md',
}) => {
    const sizeClasses = {
        sm: 'w-4 h-4 border-2',
        md: 'w-5 h-5 border-2',
        lg: 'w-8 h-8 border-3',
    };

    return (
        <Box
            className={cn(
                'border-primary border-t-transparent rounded-full animate-spin',
                sizeClasses[size],
                className,
            )}
        />
    );
};
