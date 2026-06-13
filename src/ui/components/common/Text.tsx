import React from 'react';
import type { CSSProperties } from 'react';

import {
    type FontSizeKey,
    type FontWeightKey,
    type LetterSpacingKey,
    type LineHeightKey,
    colors,
    fontSize,
    fontWeight,
    letterSpacing,
    lineHeight,
} from '@/ui/theme';

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
}

const variantColorMap: Record<TextVariant, string> = {
    default: colors.foreground,
    muted: colors.mutedForeground,
    subtle: colors.mutedForeground,
    primary: colors.primary,
    success: colors.success,
    danger: colors.danger,
    caution: colors.caution,
    inverse: colors.foregroundInverse,
};

const decorationMap: Record<TextDecoration, CSSProperties['textDecoration']> = {
    none: 'none',
    underline: 'underline',
    strike: 'line-through',
};

const transformMap: Record<TextTransform, CSSProperties['textTransform']> = {
    uppercase: 'uppercase',
    lowercase: 'lowercase',
    capitalize: 'capitalize',
    normal: 'none',
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
    style,
    children,
    ...props
}: TextProps) => {
    const s: CSSProperties = {};

    if (variant !== undefined) {
        s.color = variantColorMap[variant];
        if (variant === 'subtle') s.opacity = 0.8;
    }
    if (size !== undefined) s.fontSize = fontSize[size];
    if (weight !== undefined) s.fontWeight = fontWeight[weight];
    if (align !== undefined) s.textAlign = align;
    if (wrap !== undefined) {
        if (wrap === 'breakAll') {
            s.whiteSpace = 'normal';
            s.wordBreak = 'break-all';
        } else {
            const whiteSpaceMap: Record<
                Exclude<TextWrap, 'breakAll'>,
                CSSProperties['whiteSpace']
            > = {
                wrap: 'normal',
                nowrap: 'nowrap',
                pre: 'pre',
                preLine: 'pre-line',
                preWrap: 'pre-wrap',
            };
            s.whiteSpace = whiteSpaceMap[wrap as Exclude<TextWrap, 'breakAll'>];
        }
    }
    if (leading !== undefined) s.lineHeight = lineHeight[leading];
    if (tracking !== undefined) s.letterSpacing = letterSpacing[tracking];
    if (decoration !== undefined) s.textDecoration = decorationMap[decoration];
    if (transform !== undefined) s.textTransform = transformMap[transform];
    if (fontStyle !== undefined)
        s.fontStyle = fontStyle === 'italic' ? 'italic' : 'normal';

    return (
        <Tag
            style={{ ...s, ...style }}
            // eslint-disable-next-line react/jsx-props-no-spreading
            {...props}
        >
            {children}
        </Tag>
    );
};
