export const colors = {
    primary: 'var(--primary)',
    primaryHover: 'var(--primary-hover)',
    danger: 'var(--danger)',
    dangerHover: 'var(--danger-hover)',
    caution: 'var(--caution)',
    cautionHover: 'var(--caution-hover)',
    success: 'var(--success)',
    successHover: 'var(--success-hover)',
    primaryMuted: 'var(--primary-muted)',
    primaryMutedText: 'var(--primary-muted-text)',
    dangerMuted: 'var(--danger-muted)',
    dangerMutedText: 'var(--danger-muted-text)',
    cautionMuted: 'var(--caution-muted)',
    cautionMutedText: 'var(--caution-muted-text)',
    successMuted: 'var(--success-muted)',
    successMutedText: 'var(--success-muted-text)',
    foreground: 'var(--foreground)',
    foregroundInverse: 'var(--foreground-inverse)',
    mutedForeground: 'var(--muted-foreground)',
    background: 'var(--background)',
    bgSubtle: 'var(--bg-subtle)',
    bgSecondary: 'var(--bg-secondary)',
    borderSubtle: 'var(--border-subtle)',
    placeholder: 'var(--placeholder)',
    divider: 'var(--divider)',
    unreadBadgeBg: 'var(--unread-badge-bg, var(--danger))',
    unreadBadgeText: 'var(--unread-badge-text, #ffffff)',
    white: '#ffffff',
    transparent: 'transparent',
} as const;

export const spacing = {
    0: '0',
    none: '0',
    xs: 'var(--spacing-xs)',
    sm: 'var(--spacing-sm)',
    md: 'var(--spacing-md)',
    lg: 'var(--spacing-lg)',
    xl: 'var(--spacing-xl)',
} as const;

export const fontSize = {
    '2xs': '0.625rem',
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
} as const;

export const fontWeight = {
    light: '300',
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
} as const;

export const radius = {
    none: '0',
    sm: 'var(--radius-sm)',
    md: 'var(--radius-md)',
    lg: 'var(--radius-lg)',
    xl: '0.75rem',
    '2xl': '1rem',
    full: '9999px',
} as const;

export const shadow = {
    none: 'none',
    sm: 'var(--shadow-sm)',
    md: 'var(--shadow-md)',
    lg: 'var(--shadow-lg)',
    '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.5)',
} as const;

export const zIndex = {
    negative: -1,
    base: 0,
    content: 10,
    dropdown: 1000,
    sticky: 1010,
    fixed: 1020,
    backdrop: 1030,
    modal: 1040,
    popover: 1050,
    toast: 1060,
    tooltip: 1070,
    top: 9999,
} as const;

export const lineHeight = {
    none: 1,
    tight: 1.25,
    snug: 1.375,
    normal: 1.5,
    relaxed: 1.625,
    loose: 2,
} as const;

export const letterSpacing = {
    tighter: '-0.05em',
    tight: '-0.025em',
    normal: '0em',
    wide: '0.025em',
    wider: '0.05em',
    widest: '0.1em',
} as const;

export type SpacingKey = keyof typeof spacing;
export type ColorKey = keyof typeof colors;
export type FontSizeKey = keyof typeof fontSize;
export type FontWeightKey = keyof typeof fontWeight;
export type RadiusKey = keyof typeof radius;
export type ShadowKey = keyof typeof shadow;
export type LineHeightKey = keyof typeof lineHeight;
export type LetterSpacingKey = keyof typeof letterSpacing;
