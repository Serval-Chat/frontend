import React, { useState } from 'react';
import type { CSSProperties } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

import { colors, fontSize, radius } from '@/ui/theme';

export type InputVariant = 'default' | 'secondary' | 'admin';
export type InputSize = 'sm' | 'md' | 'lg' | 'admin';

export interface InputProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'size' | 'style'
> {
    variant?: InputVariant;
    size?: InputSize;
    minWidth?: number | string;
    maxWidth?: number | string;
    icon?: React.ReactNode;
    style?: CSSProperties;
}

const baseInputStyle: CSSProperties = {
    width: '100%',
    color: colors.foreground,
    transition: 'all 0.2s',
    outline: 'none',
    fontFamily: 'inherit',
};

const variantInputStyle: Record<InputVariant, CSSProperties> = {
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

const sizeInputStyle: Record<InputSize, CSSProperties> = {
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

const stepperBtnStyle: CSSProperties = {
    width: '20px',
    height: '16px',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    borderRadius: '2px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: colors.mutedForeground,
    padding: 0,
    transition: 'background-color 0.15s, color 0.15s',
};

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        {
            variant = 'default',
            size = 'md',
            type,
            minWidth,
            maxWidth,
            disabled,
            icon,
            style,
            ...props
        },
        ref,
    ) => {
        const internalRef = React.useRef<HTMLInputElement>(null);
        const [stepperVisible, setStepperVisible] = useState(false);

        React.useImperativeHandle(
            ref,
            (): HTMLInputElement => internalRef.current!,
        );

        const isNumber = type === 'number';

        const handleIncrement = (): void => {
            if (internalRef.current) {
                internalRef.current.stepUp();
                internalRef.current.dispatchEvent(
                    new Event('input', { bubbles: true }),
                );
            }
        };

        const handleDecrement = (): void => {
            if (internalRef.current) {
                internalRef.current.stepDown();
                internalRef.current.dispatchEvent(
                    new Event('input', { bubbles: true }),
                );
            }
        };

        return (
            <div
                style={{
                    position: 'relative',
                    display: 'flex',
                    width: '100%',
                    alignItems: 'center',
                    minWidth,
                    maxWidth,
                }}
                onMouseEnter={
                    isNumber && !disabled
                        ? () => setStepperVisible(true)
                        : undefined
                }
                onMouseLeave={
                    isNumber && !disabled
                        ? () => setStepperVisible(false)
                        : undefined
                }
            >
                {icon && (
                    <span
                        style={{
                            pointerEvents: 'none',
                            position: 'absolute',
                            left: '0.75rem',
                            display: 'flex',
                            alignItems: 'center',
                            color: colors.mutedForeground,
                        }}
                    >
                        {icon}
                    </span>
                )}
                <input
                    disabled={disabled || undefined}
                    ref={internalRef}
                    style={{
                        ...baseInputStyle,
                        ...variantInputStyle[variant],
                        ...sizeInputStyle[size],
                        ...(disabled
                            ? { cursor: 'not-allowed', opacity: 0.5 }
                            : {}),
                        ...(isNumber
                            ? {
                                  appearance: 'textfield',
                                  paddingRight: '2.25rem',
                              }
                            : {}),
                        ...(icon ? { paddingLeft: '2.25rem' } : {}),
                        minWidth: 'unset',
                        maxWidth: 'unset',
                        ...style,
                    }}
                    type={type}
                    {...props}
                />
                {isNumber && !disabled && (
                    <div
                        style={{
                            position: 'absolute',
                            right: '4px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '1px',
                            opacity: stepperVisible ? 1 : 0,
                            transition: 'opacity 0.2s',
                        }}
                    >
                        <button
                            style={stepperBtnStyle}
                            type="button"
                            onClick={handleIncrement}
                        >
                            <ChevronUp size={14} />
                        </button>
                        <button
                            style={stepperBtnStyle}
                            type="button"
                            onClick={handleDecrement}
                        >
                            <ChevronDown size={14} />
                        </button>
                    </div>
                )}
            </div>
        );
    },
);
Input.displayName = 'Input';

export { Input };
