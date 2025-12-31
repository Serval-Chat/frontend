/**
 * @description A button component. Quite versatile.
 */

import React, { useLayoutEffect, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50 px-sm py-xs font-sans',
    {
        variants: {
            variant: {
                normal: 'bg-primary text-foreground-inverse hover:bg-primary-hover',
                danger: 'bg-danger text-foreground-inverse hover:bg-danger-hover',
                caution:
                    'bg-caution text-foreground-inverse hover:bg-caution-hover',
                success:
                    'bg-success text-foreground-inverse hover:bg-success-hover',
            },
            loading: {
                true: '',
                false: '',
            },
        },
        compoundVariants: [
            {
                variant: 'normal',
                loading: true,
                class: 'bg-primary-muted text-primary-muted-text hover:bg-primary-muted',
            },
            {
                variant: 'danger',
                loading: true,
                class: 'bg-danger-muted text-danger-muted-text hover:bg-danger-muted',
            },
            {
                variant: 'caution',
                loading: true,
                class: 'bg-caution-muted text-caution-muted-text hover:bg-caution-muted',
            },
            {
                variant: 'success',
                loading: true,
                class: 'bg-success-muted text-success-muted-text hover:bg-success-muted',
            },
        ],
        defaultVariants: {
            variant: 'normal',
            loading: false,
        },
    }
);

export interface ButtonProps
    extends
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    children: React.ReactNode;
    buttonType: VariantProps<typeof buttonVariants>['variant'];
    loading?: boolean;
    retainSize?: boolean;
}

import { BouncingDots } from '../animations/BouncingDots';

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    buttonType,
    loading,
    retainSize,
    disabled,
    ...props
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dimensions, setDimensions] = useState<{
        width: number | string;
        height: number | string;
    }>({ width: 'auto', height: 'auto' });

    useLayoutEffect(() => {
        if (!loading && buttonRef.current) {
            const { width, height } = buttonRef.current.getBoundingClientRect();

            setDimensions((prev) => {
                if (retainSize && prev.width !== 'auto') {
                    return prev;
                }
                return { width, height };
            });
        }
    }, [loading, children, retainSize]);

    const finalVariant = buttonType;

    return (
        <button
            ref={buttonRef}
            style={
                loading || retainSize
                    ? {
                          width: dimensions.width,
                          height: dimensions.height,
                      }
                    : undefined
            }
            className={cn(
                'relative',
                buttonVariants({ variant: finalVariant, loading, className })
            )}
            disabled={loading || disabled}
            {...props}
        >
            <span className={cn(loading && 'opacity-0')}>{children}</span>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <BouncingDots size={4} color="bg-current" />
                </div>
            )}
        </button>
    );
};
