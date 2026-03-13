import React from 'react';

import { type Theme, useTheme } from '@/providers/ThemeProvider';
import { Button } from '@/ui/components/common/Button';
import { cn } from '@/utils/cn';

interface ThemeSwitcherProps {
    className?: string;
    variant?: 'default' | 'admin';
}

const THEMES = [
    { id: 'serval', label: 'Serval' },
    { id: 'dark', label: 'Dark' },
    { id: 'light', label: 'Light' },
    { id: 'violet', label: 'Violet' },
    { id: 'forest-green', label: 'Forest Green' },
    { id: 'high-contrast', label: 'High Contrast' },
] as const;

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({
    className,
    variant = 'default',
}) => {
    const { theme, setTheme } = useTheme();

    return (
        <div className={cn('flex flex-wrap gap-4', className)}>
            {THEMES.map((t) => (
                <Button
                    className={cn(
                        'group flex items-center justify-start gap-4 rounded-2xl border-2 p-6 shadow-none transition-all',
                        `theme-${t.id}`,
                        theme === t.id
                            ? 'border-primary bg-bg-secondary'
                            : 'hover:border-border border-border-subtle bg-bg-subtle',
                        variant === 'admin' &&
                            'min-w-[140px] flex-col items-center justify-center p-6',
                    )}
                    key={t.id}
                    variant="ghost"
                    onClick={() => setTheme(t.id as Theme)}
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
                            'flex flex-col items-start pr-2',
                            variant === 'admin' &&
                                'items-center pr-0 text-center',
                        )}
                    >
                        <span
                            className={cn(
                                'text-sm font-bold',
                                theme === t.id
                                    ? 'text-primary'
                                    : 'text-foreground',
                            )}
                        >
                            {t.label}
                        </span>
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
                    </div>
                </Button>
            ))}
        </div>
    );
};
