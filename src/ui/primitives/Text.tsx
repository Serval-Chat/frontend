import React from 'react';
import type { CSSProperties } from 'react';

import { Skeleton } from '@/ui/primitives/Skeleton';
import type {
    FontSizeKey,
    FontWeightKey,
    LetterSpacingKey,
    LineHeightKey,
} from '@/ui/theme';
import { cn } from '@/utils/cn';

export type TextVariant =
    | 'default'
    | 'muted'
    | 'subtle'
    | 'primary'
    | 'success'
    | 'danger'
    | 'caution'
    | 'inverse';

export type TextAlign = 'left' | 'center' | 'right' | 'justify';
export type TextWrap =
    | 'wrap'
    | 'nowrap'
    | 'pre'
    | 'preLine'
    | 'preWrap'
    | 'breakAll';
export type TextDecoration = 'none' | 'underline' | 'strike';
export type TextTransform = 'uppercase' | 'lowercase' | 'capitalize' | 'normal';

export interface TextProps extends Omit<
    React.HTMLAttributes<HTMLElement>,
    'style'
> {
    ref?: React.Ref<HTMLElement>;
    as?: 'span' | 'p' | 'div' | 'label';
    variant?: TextVariant;
    size?: FontSizeKey;
    weight?: FontWeightKey;
    align?: TextAlign;
    wrap?: TextWrap;
    leading?: LineHeightKey;
    tracking?: LetterSpacingKey;
    decoration?: TextDecoration;
    transform?: TextTransform;
    fontStyle?: 'italic' | 'normal';
    htmlFor?: string;
    style?: CSSProperties;
    /** Renders this text as a skeleton placeholder, sized to the real content. */
    skeleton?: boolean;
}

const variantClass: Record<TextVariant, string> = {
    default: 'text-foreground',
    muted: 'text-muted-foreground',
    subtle: 'text-muted-foreground opacity-80',
    primary: 'text-primary',
    success: 'text-success',
    danger: 'text-danger',
    caution: 'text-caution',
    inverse: 'text-foreground-inverse',
};

const sizeClass: Record<FontSizeKey, string> = {
    '2xs': 'text-2xs',
    xs: 'text-xs',
    sm: 'text-sm',
    base: 'text-base',
    lg: 'text-lg',
    xl: 'text-xl',
    '2xl': 'text-2xl',
    '3xl': 'text-3xl',
};

const weightClass: Record<FontWeightKey, string> = {
    light: 'font-light',
    normal: 'font-normal',
    medium: 'font-medium',
    semibold: 'font-semibold',
    bold: 'font-bold',
    black: 'font-black',
};

const alignClass: Record<TextAlign, string> = {
    left: 'text-left',
    center: 'text-center',
    right: 'text-right',
    justify: 'text-justify',
};

const wrapClass: Record<TextWrap, string> = {
    wrap: 'whitespace-normal',
    nowrap: 'whitespace-nowrap',
    pre: 'whitespace-pre',
    preLine: 'whitespace-pre-line',
    preWrap: 'whitespace-pre-wrap',
    breakAll: 'whitespace-normal break-all',
};

const leadingClass: Record<LineHeightKey, string> = {
    none: 'leading-none',
    tight: 'leading-tight',
    snug: 'leading-snug',
    normal: 'leading-normal',
    relaxed: 'leading-relaxed',
    loose: 'leading-loose',
};

const trackingClass: Record<LetterSpacingKey, string> = {
    tighter: 'tracking-tighter',
    tight: 'tracking-tight',
    normal: 'tracking-normal',
    wide: 'tracking-wide',
    wider: 'tracking-wider',
    widest: 'tracking-widest',
};

const decorationClass: Record<TextDecoration, string> = {
    none: 'no-underline',
    underline: 'underline',
    strike: 'line-through',
};

const transformClass: Record<TextTransform, string> = {
    uppercase: 'uppercase',
    lowercase: 'lowercase',
    capitalize: 'capitalize',
    normal: 'normal-case',
};

export const Text = ({
    as: Tag = 'span',
    variant,
    size,
    weight,
    align,
    wrap,
    leading,
    tracking,
    decoration,
    transform,
    fontStyle,
    className,
    style,
    children,
    skeleton,
    ref,
    ...props
}: TextProps) => {
    const classes = cn(
        className,
        variant !== undefined && variantClass[variant],
        size !== undefined && sizeClass[size],
        weight !== undefined && weightClass[weight],
        align !== undefined && alignClass[align],
        wrap !== undefined && wrapClass[wrap],
        leading !== undefined && leadingClass[leading],
        tracking !== undefined && trackingClass[tracking],
        decoration !== undefined && decorationClass[decoration],
        transform !== undefined && transformClass[transform],
        fontStyle !== undefined &&
            (fontStyle === 'italic' ? 'italic' : 'not-italic'),
    );

    if (skeleton) {
        return (
            <Tag
                aria-hidden
                className={cn(classes, 'relative inline-block')}
                ref={ref as React.Ref<never>}
                style={style}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
            >
                <span style={{ visibility: 'hidden' }}>{children}</span>
                <Skeleton className="absolute inset-0" variant="text" />
            </Tag>
        );
    }

    return (
        <Tag
            className={classes || undefined}
            ref={ref as React.Ref<never>}
            style={style}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
        >
            {children}
        </Tag>
    );
};
