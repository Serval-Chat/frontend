import React, { useLayoutEffect, useRef, useState } from 'react';

import { type VariantProps } from 'class-variance-authority';

import { BouncingDots } from '@/ui/animations/BouncingDots';
import { cn } from '@/utils/cn';

import { buttonVariants } from './buttonVariants';

export interface ButtonProps
    extends
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    children: React.ReactNode;
    loading?: boolean;
    retainSize?: boolean;
    innerClassName?: string;
    icon?: React.ElementType;
    iconClassName?: string;
    iconPosition?: 'left' | 'right';
}

export const Button = React.memo(
    React.forwardRef<HTMLButtonElement, ButtonProps>(
        (
            {
                children,
                className,
                variant,
                size,
                loading,
                retainSize,
                innerClassName,
                disabled,
                icon: Icon,
                iconClassName,
                iconPosition = 'left',
                ...props
            },
            ref,
        ) => {
            const buttonRef = useRef<HTMLButtonElement>(null);
            const [dimensions, setDimensions] = useState<{
                width: number | string;
                height: number | string;
            }>({ width: 'auto', height: 'auto' });

            useLayoutEffect(() => {
                if (!retainSize && !loading) return;

                const updateDimensions = (): void => {
                    if (!buttonRef.current) return;
                    const { width, height } =
                        buttonRef.current.getBoundingClientRect();
                    setDimensions((prev) => {
                        if (retainSize && prev.width !== 'auto') return prev;
                        if (loading && prev.width !== 'auto') return prev;

                        if (prev.width === width && prev.height === height)
                            return prev;
                        return { width, height };
                    });
                };

                updateDimensions();

                window.addEventListener('resize', updateDimensions);
                return () =>
                    window.removeEventListener('resize', updateDimensions);
            }, [loading, retainSize, children]);

            const dimensionStyles =
                (retainSize || loading) && dimensions.width !== 'auto'
                    ? { width: dimensions.width, height: dimensions.height }
                    : undefined;

            React.useImperativeHandle(ref, () => buttonRef.current!);

            return (
                <button
                    aria-busy={loading || undefined}
                    className={cn(
                        'relative',
                        buttonVariants({ variant, size }),
                        className,
                    )}
                    disabled={loading || disabled}
                    ref={buttonRef}
                    style={dimensionStyles}
                    {...props}
                >
                    <span
                        className={cn(
                            'flex items-center justify-center gap-[inherit]',
                            loading ? 'opacity-0' : undefined,
                            innerClassName,
                        )}
                    >
                        {Icon && iconPosition === 'left' && (
                            <Icon
                                className={cn('shrink-0', iconClassName)}
                                size={16}
                            />
                        )}
                        {children}
                        {Icon && iconPosition === 'right' && (
                            <Icon
                                className={cn('shrink-0', iconClassName)}
                                size={16}
                            />
                        )}
                    </span>
                    {loading && (
                        <div className="absolute inset-0 flex items-center justify-center">
                            <BouncingDots color="bg-current" size={4} />
                        </div>
                    )}
                </button>
            );
        },
    ),
);

Button.displayName = 'Button';
