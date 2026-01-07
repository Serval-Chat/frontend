import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const headingVariants = cva('font-bold', {
    variants: {
        variant: {
            page: 'text-3xl tracking-tight text-foreground',
            section: 'my-md text-xl font-sans',
            sub: 'text-lg font-semibold mb-md',
        },
    },
    defaultVariants: {
        variant: 'page',
    },
});

export interface HeadingProps
    extends
        React.HTMLAttributes<HTMLHeadingElement>,
        VariantProps<typeof headingVariants> {
    level?: 1 | 2 | 3 | 4 | 5 | 6;
}

/**
 * @description Header of various sizes and variants
 */
export const Heading: React.FC<HeadingProps> = ({
    level = 1,
    variant,
    className,
    children,
    ...props
}) => {
    const Tag = `h${level}` as React.ElementType;

    return (
        <Tag className={cn(headingVariants({ variant, className }))} {...props}>
            {children}
        </Tag>
    );
};
