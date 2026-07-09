import React from 'react';

import { colors, fontSize, radius } from '@/ui/theme';

export interface ToggleProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type' | 'style'
> {
    ref?: React.Ref<HTMLInputElement>;
    label?: string;
    onCheckedChange?: (checked: boolean) => void;
    style?: React.CSSProperties;
}

const labelBaseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
};

const trackBaseStyle: React.CSSProperties = {
    position: 'relative',
    display: 'inline-flex',
    height: '1.5rem',
    width: '2.75rem',
    alignItems: 'center',
    borderRadius: radius.full,
    transition: 'background-color 0.2s',
    flexShrink: 0,
};

const inputStyle: React.CSSProperties = {
    position: 'absolute',
    width: '1px',
    height: '1px',
    padding: 0,
    margin: '-1px',
    overflow: 'hidden',
    clip: 'rect(0,0,0,0)',
    whiteSpace: 'nowrap',
    border: 0,
};

const thumbBaseStyle: React.CSSProperties = {
    display: 'inline-block',
    height: '1.25rem',
    width: '1.25rem',
    borderRadius: radius.full,
    backgroundColor: colors.white,
    boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.3)',
    transition: 'transform 0.2s',
    flexShrink: 0,
};

export const Toggle = ({
    disabled,
    checked,
    label,
    onCheckedChange,
    onChange,
    style,
    ref,
    ...props
}: ToggleProps) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        onChange?.(e);
        onCheckedChange?.(e.target.checked);
    };

    return (
        <label
            style={{
                ...labelBaseStyle,
                cursor: disabled ? 'not-allowed' : 'pointer',
                ...style,
            }}
        >
            <span
                style={{
                    ...trackBaseStyle,
                    backgroundColor: checked
                        ? colors.primary
                        : colors.bgSecondary,
                    opacity: disabled ? 0.5 : 1,
                    cursor: disabled ? 'not-allowed' : 'pointer',
                }}
            >
                <input
                    checked={checked}
                    disabled={disabled}
                    ref={ref}
                    style={inputStyle}
                    type="checkbox"
                    onChange={handleChange}
                    {...props}
                />
                <span
                    style={{
                        ...thumbBaseStyle,
                        transform: `translateX(${checked ? '1.375rem' : '0.125rem'})`,
                    }}
                />
            </span>
            {label ? (
                <span
                    style={{
                        fontSize: fontSize.sm,
                        color: colors.foreground,
                        opacity: disabled ? 0.5 : 1,
                    }}
                >
                    {label}
                </span>
            ) : null}
        </label>
    );
};

Toggle.displayName = 'Toggle';
