import React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/utils/cn';

const textVariants = cva('', {
    variants: {
        variant: {
            default: 'text-foreground',
            muted: 'text-muted-foreground',
            primary: 'text-primary',
            success: 'text-success',
            danger: 'text-danger',
        },
        size: {
            xs: 'text-xs',
            sm: 'text-sm',
            base: 'text-base',
            lg: 'text-lg',
            xl: 'text-xl',
            '2xl': 'text-2xl',
        },
        weight: {
            light: 'font-light',
            normal: 'font-normal',
            medium: 'font-medium',
            semibold: 'font-semibold',
            bold: 'font-bold',
            black: 'font-black',
        },
        fontStyle: {
            italic: 'italic',
            normal: 'not-italic',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'base',
        weight: 'normal',
        fontStyle: 'normal',
    },
});

export interface TextProps
    extends
        Omit<React.HTMLAttributes<HTMLElement>, 'style'>,
        VariantProps<typeof textVariants> {
    as?: 'span' | 'p' | 'div' | 'label';
    style?: React.CSSProperties;
    htmlFor?: string;
}

/**
 * @description Text component
 */
export const Text: React.FC<TextProps> = ({
    className,
    variant,
    size,
    weight,
    fontStyle,
    as: Tag = 'span',
    children,
    ...props
}) => (
    <Tag
        className={cn(
            textVariants({ variant, size, weight, fontStyle, className }),
        )}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
    >
        {children}
    </Tag>
);
