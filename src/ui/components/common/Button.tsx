import React, { useLayoutEffect, useRef, useState } from 'react';

import { BouncingDots } from '@/ui/animations/BouncingDots';

import {
    type ButtonSize,
    type ButtonVariant,
    buttonBaseStyle,
    buttonSizeStyles,
    buttonSquareSizeStyles,
    buttonVariantStyles,
} from './buttonStyles';

export interface ButtonProps extends Omit<
    React.ButtonHTMLAttributes<HTMLButtonElement>,
    'style'
> {
    children: React.ReactNode;
    variant?: ButtonVariant;
    size?: ButtonSize;
    loading?: boolean;
    retainSize?: boolean;
    square?: boolean;
    fullWidth?: boolean;
    justify?: 'start' | 'center' | 'end' | 'between';
    icon?: React.ElementType;
    iconSize?: number;
    iconPosition?: 'left' | 'right';
    style?: React.CSSProperties;
}

const justifyMap: Record<string, React.CSSProperties['justifyContent']> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
};

const ButtonComponent = ({
    children,
    variant = 'normal',
    size = 'md',
    loading,
    retainSize,
    square,
    fullWidth,
    justify,
    disabled,
    icon: Icon,
    iconSize = 16,
    iconPosition = 'left',
    style,
    ...props
}: ButtonProps & { ref?: React.Ref<HTMLButtonElement> }) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [hovered, setHovered] = useState(false);
    const [dimensions, setDimensions] = useState<{
        width: number | string;
        height: number | string;
    }>({ width: 'auto', height: 'auto' });

    useLayoutEffect((): (() => void) | undefined => {
        if (!retainSize && !loading) return;

        const updateDimensions = (): void => {
            if (!buttonRef.current) return;
            const { width, height } = buttonRef.current.getBoundingClientRect();
            setDimensions((prev) => {
                if (retainSize && prev.width !== 'auto') return prev;
                if (loading && prev.width !== 'auto') return prev;
                if (prev.width === width && prev.height === height) return prev;
                return { width, height };
            });
        };

        updateDimensions();
        window.addEventListener('resize', updateDimensions);
        return (): void =>
            window.removeEventListener('resize', updateDimensions);
    }, [loading, retainSize, children]);

    const variantStyleSet = buttonVariantStyles[variant];
    const isActive = hovered && !disabled && !loading;

    const computedStyle: React.CSSProperties = {
        ...buttonBaseStyle,
        ...(variant !== 'nav' ? buttonSizeStyles[size] : {}),
        ...variantStyleSet.base,
        ...(isActive ? variantStyleSet.hover : {}),
        ...(square ? buttonSquareSizeStyles[size] : {}),
        ...(fullWidth ? { width: '100%' } : {}),
        ...(justify ? { justifyContent: justifyMap[justify] } : {}),
        ...(disabled || loading
            ? { opacity: 0.5, pointerEvents: 'none', cursor: 'not-allowed' }
            : {}),
        ...((retainSize || loading) && dimensions.width !== 'auto'
            ? { width: dimensions.width, height: dimensions.height }
            : {}),
        ...style,
    };

    return (
        <button
            aria-busy={loading || undefined}
            disabled={loading || disabled}
            ref={buttonRef}
            style={computedStyle}
            type="button"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
            {...props}
        >
            <span style={{ display: 'contents', opacity: loading ? 0 : 1 }}>
                {Icon && iconPosition === 'left' && (
                    <Icon size={iconSize} style={{ flexShrink: 0 }} />
                )}
                {children}
                {Icon && iconPosition === 'right' && (
                    <Icon size={iconSize} style={{ flexShrink: 0 }} />
                )}
            </span>
            {loading && (
                <span
                    style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                    }}
                >
                    <BouncingDots color="currentColor" size={4} />
                </span>
            )}
        </button>
    );
};

export const Button = React.memo(ButtonComponent);

Button.displayName = 'Button';
