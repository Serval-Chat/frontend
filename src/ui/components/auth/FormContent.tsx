import React from 'react';

import { cn } from '@/utils/cn';

interface FormContentProps {
    children: React.ReactNode;
    className?: string;
}

/**
 * @description container for forms
 */
export const FormContent: React.FC<FormContentProps> = ({
    children,
    className,
}) => (
    <div
        className={cn(
            'relative z-content w-full max-w-110 flex-shrink-0 space-y-xl rounded-lg border border-border-subtle bg-bg-subtle/50 p-lg shadow-lg backdrop-blur-xl',
            className,
        )}
    >
        {children}
    </div>
);
