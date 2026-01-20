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
            'relative z-content w-full max-w-110 p-lg bg-bg-subtle/50 backdrop-blur-xl border border-border-subtle rounded-lg shadow-lg space-y-xl flex-shrink-0',
            className
        )}
    >
        {children}
    </div>
);
