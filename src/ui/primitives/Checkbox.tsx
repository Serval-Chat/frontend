import React from 'react';

import { cn } from '@/utils/cn';

export interface CheckboxProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type'
> {
    ref?: React.Ref<HTMLInputElement>;
    label?: React.ReactNode;
    onCheckedChange?: (checked: boolean) => void;
}

export const Checkbox = ({
    label,
    onCheckedChange,
    onChange,
    className,
    disabled,
    ref,
    ...props
}: CheckboxProps) => {
    const input = (
        <input
            className={cn(
                'size-4 shrink-0 cursor-pointer accent-primary disabled:cursor-not-allowed disabled:opacity-50',
                label === undefined && className,
            )}
            disabled={disabled}
            ref={ref}
            type="checkbox"
            onChange={(event): void => {
                onChange?.(event);
                onCheckedChange?.(event.target.checked);
            }}
            {...props}
        />
    );
    if (label === undefined) return input;
    return (
        <label
            className={cn(
                'inline-flex cursor-pointer items-center gap-2 text-sm text-foreground',
                disabled && 'cursor-not-allowed opacity-50',
                className,
            )}
        >
            {input}
            {label}
        </label>
    );
};
