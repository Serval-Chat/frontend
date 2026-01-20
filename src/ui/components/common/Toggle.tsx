import React from 'react';

import { cn } from '@/utils/cn';

export interface ToggleProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type'
> {
    label?: string;
    onCheckedChange?: (checked: boolean) => void;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
    (
        {
            className,
            disabled,
            checked,
            label,
            onCheckedChange,
            onChange,
            ...props
        },
        ref
    ) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
        };

        return (
            <label
                className={cn(
                    'inline-flex items-center gap-2',
                    disabled ? 'cursor-not-allowed' : 'cursor-pointer',
                    className
                )}
            >
                <span
                    className={cn(
                        'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
                        disabled && 'cursor-not-allowed opacity-50',
                        !disabled && 'cursor-pointer',
                        checked ? 'bg-primary' : 'bg-bg-secondary'
                    )}
                >
                    <input
                        checked={checked}
                        className="sr-only peer"
                        disabled={disabled}
                        ref={ref}
                        type="checkbox"
                        onChange={handleChange}
                        {...props}
                    />
                    <span
                        className={cn(
                            'inline-block h-5 w-5 transform rounded-full bg-white shadow-sm transition-transform',
                            checked ? 'translate-x-5' : 'translate-x-0.5'
                        )}
                    />
                </span>
                {label && (
                    <span
                        className={cn(
                            'text-sm text-foreground',
                            disabled && 'opacity-50'
                        )}
                    >
                        {label}
                    </span>
                )}
            </label>
        );
    }
);

Toggle.displayName = 'Toggle';
