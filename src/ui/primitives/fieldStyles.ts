import type { CSSProperties } from 'react';

import { colors, fontSize, radius } from '@/ui/theme';

export type InputVariant = 'default' | 'secondary' | 'admin';
export type InputSize = 'sm' | 'md' | 'lg' | 'admin';

export const baseInputStyle: CSSProperties = {
    width: '100%',
    color: colors.foreground,
    transition: 'all 0.2s',
    outline: 'none',
    fontFamily: 'inherit',
};

export const variantInputStyle: Record<InputVariant, CSSProperties> = {
    default: {
        border: `1px solid ${colors.borderSubtle}`,
        backgroundColor: colors.bgSubtle,
    },
    secondary: {
        border: `1px solid ${colors.borderSubtle}`,
        backgroundColor: colors.bgSecondary,
    },
    admin: {
        border: `1px solid ${colors.borderSubtle}`,
        backgroundColor: colors.background,
    },
};

export const sizeInputStyle: Record<InputSize, CSSProperties> = {
    sm: {
        height: '2rem',
        borderRadius: radius.sm,
        paddingInline: '0.5rem',
        paddingBlock: '0.25rem',
        fontSize: fontSize.xs,
    },
    md: {
        height: '2.5rem',
        borderRadius: radius.md,
        paddingInline: '0.75rem',
        paddingBlock: '0.5rem',
        fontSize: fontSize.sm,
    },
    lg: {
        height: '3rem',
        borderRadius: radius.lg,
        paddingInline: '1rem',
        paddingBlock: '0.75rem',
        fontSize: fontSize.base,
    },
    admin: {
        height: '2.75rem',
        borderRadius: radius.xl,
        paddingInline: '1rem',
        paddingBlock: '0.625rem',
        fontSize: fontSize.sm,
    },
};
