import type { CSSProperties } from 'react';

import { colors, fontSize, fontWeight, radius, spacing } from '@/ui/theme';

export type ButtonVariant =
    | 'normal'
    | 'primary'
    | 'danger'
    | 'caution'
    | 'success'
    | 'ghost'
    | 'nav';

export type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonStyleSet {
    base: CSSProperties;
    hover: CSSProperties;
}

export const buttonBaseStyle: CSSProperties = {
    display: 'inline-flex',
    cursor: 'pointer',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    fontFamily: 'var(--font-sans)',
    fontWeight: fontWeight.medium,
    whiteSpace: 'nowrap',
    transition: 'background-color 0.3s, border-color 0.3s, color 0.2s',
    position: 'relative',
    border: 'none',
    outline: 'none',
};

export const buttonVariantStyles: Record<ButtonVariant, ButtonStyleSet> = {
    normal: {
        base: {
            backgroundColor: colors.background,
            color: colors.foreground,
            border: `1px solid ${colors.borderSubtle}`,
        },
        hover: {
            backgroundColor: colors.bgSecondary,
            borderColor: colors.primary,
        },
    },
    primary: {
        base: {
            backgroundColor: colors.primary,
            color: colors.foregroundInverse,
        },
        hover: { backgroundColor: colors.primaryHover },
    },
    danger: {
        base: {
            backgroundColor: colors.danger,
            color: colors.white,
        },
        hover: { backgroundColor: colors.dangerHover },
    },
    caution: {
        base: {
            backgroundColor: colors.caution,
            color: colors.foregroundInverse,
        },
        hover: { backgroundColor: colors.cautionHover },
    },
    success: {
        base: {
            backgroundColor: colors.success,
            color: colors.foregroundInverse,
        },
        hover: { backgroundColor: colors.successHover },
    },
    ghost: {
        base: {
            backgroundColor: colors.transparent,
            color: colors.foreground,
        },
        hover: { backgroundColor: colors.bgSubtle },
    },
    nav: {
        base: {
            width: '3rem',
            height: '3rem',
            borderRadius: '1.2rem',
            backgroundColor: colors.bgSecondary,
            color: colors.foreground,
            padding: 0,
            transition: 'border-radius 0.2s, background-color 0.2s, color 0.2s',
        },
        hover: {
            borderRadius: radius.lg,
            backgroundColor: colors.primary,
            color: colors.foregroundInverse,
        },
    },
};

export const buttonSizeStyles: Record<ButtonSize, CSSProperties> = {
    sm: {
        paddingInline: spacing.xs,
        paddingBlock: spacing.xs,
        fontSize: fontSize.xs,
    },
    md: {
        paddingInline: spacing.xs,
        paddingBlock: spacing.xs,
        fontSize: fontSize.sm,
    },
    lg: {
        paddingInline: spacing.sm,
        paddingBlock: spacing.sm,
        fontSize: fontSize.base,
    },
};

export const buttonSquareSizeStyles: Record<ButtonSize, CSSProperties> = {
    sm: { width: '2rem', height: '2rem', padding: 0, minWidth: 0 },
    md: { width: '2.5rem', height: '2.5rem', padding: 0, minWidth: 0 },
    lg: { width: '3rem', height: '3rem', padding: 0, minWidth: 0 },
};
