import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const stackVariants = cva('flex', {
    variants: {
        direction: {
            row: 'flex-row',
            col: 'flex-col',
        },
        gap: {
            none: 'gap-0',
            xs: 'gap-xs',
            sm: 'gap-sm',
            md: 'gap-md',
            lg: 'gap-lg',
            xl: 'gap-xl',
        },
        wrap: {
            true: 'flex-wrap',
            false: 'flex-nowrap',
        },
        align: {
            start: 'items-start',
            center: 'items-center',
            end: 'items-end',
            stretch: 'items-stretch',
        },
        justify: {
            start: 'justify-start',
            center: 'justify-center',
            end: 'justify-end',
            between: 'justify-between',
        },
    },
    defaultVariants: {
        direction: 'col',
        gap: 'md',
        wrap: false,
        align: 'stretch',
        justify: 'start',
    },
});

export interface StackProps
    extends
        React.HTMLAttributes<HTMLDivElement>,
        VariantProps<typeof stackVariants> {
    children: React.ReactNode;
}

/**
 * @description Generic flexbox container component
 */
export const Stack: React.FC<StackProps> = ({
    direction,
    gap,
    wrap,
    align,
    justify,
    className,
    children,
    ...props
}) => {
    return (
        <div
            className={cn(
                stackVariants({
                    direction,
                    gap,
                    wrap,
                    align,
                    justify,
                    className,
                })
            )}
            {...props}
        >
            {children}
        </div>
    );
};
