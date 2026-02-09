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
                        'group flex items-center gap-4 p-6 rounded-2xl border-2 transition-all shadow-none justify-start',
                        `theme-${t.id}`,
                        theme === t.id
                            ? 'border-[var(--color-primary)] bg-[var(--color-bg-secondary)]'
                            : 'border-[var(--color-border-subtle)] bg-[var(--color-bg-subtle)] hover:border-[var(--color-border)]',
                        variant === 'admin' &&
                            'flex-col items-center justify-center p-6 min-w-[140px]',
                    )}
                    key={t.id}
                    variant="ghost"
                    onClick={() => setTheme(t.id as Theme)}
                >
                    <div
                        className={cn(
                            'flex flex-col gap-1 rounded-lg p-1.5 border border-white/10 bg-[var(--background)] overflow-hidden shadow-sm',
                            variant === 'admin' ? 'w-20 h-14' : 'w-12 h-10',
                        )}
                    >
                        <div className="w-full h-2 rounded-sm bg-[var(--primary)]" />
                        <div className="w-2/3 h-1.5 rounded-sm bg-[var(--foreground)] opacity-20" />
                        <div className="w-1/2 h-1.5 rounded-sm bg-[var(--foreground)] opacity-10" />
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
                                    ? 'text-[var(--color-primary)]'
                                    : 'text-[var(--color-foreground)]',
                            )}
                        >
                            {t.label}
                        </span>
                        <div className="flex gap-1 mt-1">
                            <div
                                className="w-2.5 h-2.5 rounded-full bg-[var(--primary)]"
                                title="Primary"
                            />
                            <div
                                className="w-2.5 h-2.5 rounded-full bg-[var(--primary-muted)]"
                                title="Primary Muted"
                            />
                            <div
                                className="w-2.5 h-2.5 rounded-full bg-[var(--success)]"
                                title="Success"
                            />
                            <div
                                className="w-2.5 h-2.5 rounded-full bg-[var(--danger)]"
                                title="Danger"
                            />
                        </div>
                    </div>
                </Button>
            ))}
        </div>
    );
};
