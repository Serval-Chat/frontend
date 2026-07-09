import type React from 'react';

import { useTheme } from '@/providers/ThemeProvider';
import type { CustomThemeFile } from '@/styles/customThemes';
import { Button } from '@/ui/components/common/Button';
import { cn } from '@/utils/cn';

interface ThemeSwitcherProps {
    className?: string;
    variant?: 'default' | 'admin';
}

const THEMES = [
    { id: 'serval', label: 'Serval' },
    { id: 'dark', label: 'Dark' },
    { id: 'deep-ocean', label: 'Deep Ocean' },
    { id: 'light', label: 'Light' },
    { id: 'cherry', label: 'Cherry' },
    { id: 'violet', label: 'Violet' },
    { id: 'forest-green', label: 'Forest Green' },
    { id: 'high-contrast', label: 'High Contrast' },
    { id: 'pride', label: 'Pride' },
] as const;

const THEME_VARIABLES = [
    '--background',
    '--foreground',
    '--primary',
    '--primary-muted',
    '--success',
    '--danger',
] as const;

const extractThemeVariables = (
    customTheme: CustomThemeFile,
): React.CSSProperties => {
    const styles: Record<string, string> = {};
    const css = customTheme.sourceCss || customTheme.css;

    for (const variable of THEME_VARIABLES) {
        const escapedVariable = variable.replace('--', String.raw`\-\-`);
        const match = new RegExp(
            `${escapedVariable}\\s*:\\s*([^;}{]+)`,
            'i',
        ).exec(css);

        if (match?.[1]) {
            styles[variable] = match[1].trim();
        }
    }

    return styles as React.CSSProperties;
};

interface ThemeCardProps {
    isActive: boolean;
    label: string;
    meta?: string;
    onClick: () => void;
    variant: 'default' | 'admin';
    className?: string;
    style?: React.CSSProperties;
}

const ThemeCard = ({
    isActive,
    label,
    meta,
    onClick,
    variant,
    className,
    style,
}: ThemeCardProps) => (
    <Button
        className={cn(
            'group flex items-center justify-start gap-4 rounded-2xl border-2 p-6 shadow-none transition-all',
            isActive
                ? 'border-primary bg-bg-secondary'
                : 'hover:border-border border-border-subtle bg-bg-subtle',
            variant === 'admin' &&
                'min-w-[140px] flex-col items-center justify-center p-6',
            className,
        )}
        style={style}
        variant="ghost"
        onClick={onClick}
    >
        <div
            className={cn(
                'flex flex-col gap-1 overflow-hidden rounded-lg border border-white/10 bg-[var(--background)] p-1.5 shadow-sm',
                variant === 'admin' ? 'h-14 w-20' : 'h-10 w-12',
            )}
        >
            <div className="h-2 w-full rounded-sm bg-[var(--primary)]" />
            <div className="h-1.5 w-2/3 rounded-sm bg-[var(--foreground)] opacity-20" />
            <div className="h-1.5 w-1/2 rounded-sm bg-[var(--foreground)] opacity-10" />
        </div>
        <div
            className={cn(
                'flex min-w-0 flex-col items-start pr-2',
                variant === 'admin' && 'items-center pr-0 text-center',
            )}
        >
            <span
                className={cn(
                    'max-w-full truncate text-sm font-bold',
                    isActive ? 'text-primary' : 'text-foreground',
                )}
            >
                {label}
            </span>
            {meta ? (
                <span className="max-w-full truncate text-xs text-muted-foreground">
                    {meta}
                </span>
            ) : (
                <div className="mt-1 flex gap-1">
                    <div
                        className="h-2.5 w-2.5 rounded-full bg-[var(--primary)]"
                        title="Primary"
                    />
                    <div
                        className="h-2.5 w-2.5 rounded-full bg-[var(--primary-muted)]"
                        title="Primary Muted"
                    />
                    <div
                        className="h-2.5 w-2.5 rounded-full bg-[var(--success)]"
                        title="Success"
                    />
                    <div
                        className="h-2.5 w-2.5 rounded-full bg-[var(--danger)]"
                        title="Danger"
                    />
                </div>
            )}
        </div>
    </Button>
);

export const ThemeSwitcher = ({
    className,
    variant = 'default',
}: ThemeSwitcherProps) => {
    const { customThemes, theme, setTheme } = useTheme();

    return (
        <div className={cn('flex flex-wrap gap-4', className)}>
            {THEMES.map((t) => (
                <ThemeCard
                    className={`theme-${t.id}`}
                    isActive={theme === t.id}
                    key={t.id}
                    label={t.label}
                    variant={variant}
                    onClick={(): void => {
                        setTheme(t.id);
                    }}
                />
            ))}
            {customThemes.map((t) => (
                <ThemeCard
                    isActive={theme === `custom:${t.id}`}
                    key={t.id}
                    label={t.name}
                    meta={
                        t.metadata?.author
                            ? `by ${t.metadata.author}`
                            : 'Custom CSS'
                    }
                    style={extractThemeVariables(t)}
                    variant={variant}
                    onClick={(): void => {
                        setTheme(`custom:${t.id}`);
                    }}
                />
            ))}
        </div>
    );
};
