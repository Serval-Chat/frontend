import React from 'react';

import { colors, fontSize, radius } from '@/ui/theme';

export interface ToggleProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'style'
> {
    label?: string;
    onCheckedChange?: (checked: boolean) => void;
    style?: React.CSSProperties;
}

export const Toggle = React.forwardRef<HTMLInputElement, ToggleProps>(
    (
        {
            disabled,
            checked,
            label,
            onCheckedChange,
            onChange,
            style,
            ...props
        },
        ref,
    ) => {
        const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
            onChange?.(e);
            onCheckedChange?.(e.target.checked);
        };

        return (
            <label
                style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    ...style,
                }}
            >
                <span
                    style={{
                        position: 'relative',
                        display: 'inline-flex',
                        height: '1.5rem',
                        width: '2.75rem',
                        alignItems: 'center',
                        borderRadius: radius.full,
                        transition: 'background-color 0.2s',
                        backgroundColor: checked
                            ? colors.primary
                            : colors.bgSecondary,
                        opacity: disabled ? 0.5 : 1,
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        flexShrink: 0,
                    }}
                >
                    <input
                        checked={checked}
                        disabled={disabled}
                        ref={ref}
                        style={{
                            position: 'absolute',
                            width: '1px',
                            height: '1px',
                            padding: 0,
                            margin: '-1px',
                            overflow: 'hidden',
                            clip: 'rect(0,0,0,0)',
                            whiteSpace: 'nowrap',
                            border: 0,
                        }}
                        type="checkbox"
                        onChange={handleChange}
                        {...props}
                    />
                    <span
                        style={{
                            display: 'inline-block',
                            height: '1.25rem',
                            width: '1.25rem',
                            borderRadius: radius.full,
                            backgroundColor: colors.white,
                            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
                            transition: 'transform 0.2s',
                            transform: `translateX(${checked ? '1.375rem' : '0.125rem'})`,
                            flexShrink: 0,
                        }}
                    />
                </span>
                {label && (
                    <span
                        style={{
                            fontSize: fontSize.sm,
                            color: colors.foreground,
                            opacity: disabled ? 0.5 : 1,
                        }}
                    >
                        {label}
                    </span>
                )}
            </label>
        );
    },
);

Toggle.displayName = 'Toggle';
