import React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/utils/cn';

const textVariants = cva('', {
    variants: {
        variant: {
            default: 'text-[var(--color-foreground)]',
            muted: 'text-[var(--color-muted-foreground)]',
            subtle: 'text-[var(--color-muted-foreground)] opacity-80',
            primary: 'text-[var(--color-primary)]',
            success: 'text-[var(--color-success)]',
            danger: 'text-[var(--color-danger)]',
            caution: 'text-[var(--color-caution)]',
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
        transform: {
            uppercase: 'uppercase',
            lowercase: 'lowercase',
            capitalize: 'capitalize',
            normal: 'normal-case',
        },
        align: {
            left: 'text-left',
            center: 'text-center',
            right: 'text-right',
            justify: 'text-justify',
        },
        wrap: {
            wrap: 'whitespace-normal',
            nowrap: 'whitespace-nowrap',
            pre: 'whitespace-pre',
            preLine: 'whitespace-pre-line',
            preWrap: 'whitespace-pre-wrap',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'base',
        weight: 'normal',
        fontStyle: 'normal',
        transform: 'normal',
        align: 'left',
        wrap: 'wrap',
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
    transform,
    align,
    wrap,
    as: Tag = 'span',
    children,
    ...props
}) => (
    <Tag
        className={cn(
            textVariants({
                variant,
                size,
                weight,
                fontStyle,
                transform,
                align,
                wrap,
                className,
            }),
        )}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
    >
        {children}
    </Tag>
);
