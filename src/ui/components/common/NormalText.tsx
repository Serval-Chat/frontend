import React from 'react';
import { cn } from '@/utils/cn';

interface NormalTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
    children: React.ReactNode;
    className?: string;
}

/**
 * @description Standard text
 */
export const NormalText: React.FC<NormalTextProps> = ({
    children,
    className,
    style,
    ...props
}) => {
    return (
        <p
            className={cn('text-foreground', className)}
            style={style}
            {...props}
        >
            {children}
        </p>
    );
};
