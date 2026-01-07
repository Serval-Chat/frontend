import React from 'react';
import { cn } from '@/utils/cn';

interface NormalTextProps extends React.HTMLAttributes<HTMLParagraphElement> {
    children: React.ReactNode;
    className?: string;
    size?: 'xs' | 'sm' | 'base' | 'lg' | 'xl' | '2xl';
    weight?: 'light' | 'normal' | 'medium' | 'semibold' | 'bold';
}

/**
 * @description Standard text component with configurable size and weight
 */
export const NormalText: React.FC<NormalTextProps> = ({
    children,
    className,
    style,
    size,
    weight,
    ...props
}) => {
    const sizeParam = size ? `text-${size}` : '';
    const weightParam = weight ? `font-${weight}` : '';

    return (
        <p
            className={cn('text-foreground', sizeParam, weightParam, className)}
            style={style}
            {...props}
        >
            {children}
        </p>
    );
};
