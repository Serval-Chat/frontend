import React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { cn } from '@/utils/cn';

const textVariants = cva('', {
    variants: {
        variant: {
            default: 'text-foreground',
            muted: 'text-muted-foreground',
            subtle: 'text-muted-foreground opacity-80',
            primary: 'text-primary',
            success: 'text-success',
            danger: 'text-danger',
            caution: 'text-caution',
            inverse: 'text-foreground-inverse',
        },
        size: {
            '2xs': 'text-[10px]',
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
            breakAll: 'break-all',
        },
        leading: {
            none: 'leading-none',
            tight: 'leading-tight',
            snug: 'leading-snug',
            normal: 'leading-normal',
            relaxed: 'leading-relaxed',
            loose: 'leading-loose',
        },
        tracking: {
            tighter: 'tracking-tighter',
            tight: 'tracking-tight',
            normal: 'tracking-normal',
            wide: 'tracking-wide',
            wider: 'tracking-wider',
            widest: 'tracking-widest',
        },
        decoration: {
            none: 'no-underline',
            underline: 'underline',
            strike: 'line-through',
        },
    },
    defaultVariants: {
        variant: 'default',
        size: 'base',
        weight: 'normal',
        fontStyle: 'normal',
        transform: 'normal',
        align: 'left',
        decoration: 'none',
        wrap: 'wrap',
        leading: 'normal',
        tracking: 'normal',
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
    leading,
    tracking,
    decoration,
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
                leading,
                tracking,
                decoration,
                className,
            }),
        )}
        // eslint-disable-next-line react/jsx-props-no-spreading
        {...props}
    >
        {children}
    </Tag>
);
