import React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/utils/cn';

const headingVariants = cva('font-bold', {
    variants: {
        variant: {
            page: 'text-3xl tracking-tight text-foreground',
            section: 'my-md text-xl font-sans',
            sub: 'text-lg font-semibold mb-md',
            'chat-h1': 'text-2xl mt-1 mb-0.5',
            'chat-h2': 'text-xl mt-0.5 mb-0',
            'chat-h3': 'text-lg mt-0.5 mb-0',
            'admin-page': 'text-2xl font-black tracking-tight',
            'admin-section': 'text-xl font-black tracking-tight uppercase',
            'admin-sub': 'text-sm font-black uppercase tracking-wider',
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
        // eslint-disable-next-line react/jsx-props-no-spreading
        <Tag className={cn(headingVariants({ variant, className }))} {...props}>
            {children}
        </Tag>
    );
};
