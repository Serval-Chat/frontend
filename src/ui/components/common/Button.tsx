/**
 * @description A button component. Quite versatile.
 */
import React, { useLayoutEffect, useRef, useState } from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { BouncingDots } from '@/ui/animations/BouncingDots';
import { cn } from '@/utils/cn';

const mutedClasses = {
    normal: 'bg-primary-muted text-primary-muted-text hover:bg-primary-muted',
    danger: 'bg-danger-muted text-danger-muted-text hover:bg-danger-muted',
    caution: 'bg-caution-muted text-caution-muted-text hover:bg-caution-muted',
    success: 'bg-success-muted text-success-muted-text hover:bg-success-muted',
};

const buttonVariants = cva(
    'bg-background inline-flex items-center justify-center rounded-md transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50 font-sans whitespace-nowrap cursor-pointer',
    {
        variants: {
            variant: {
                normal: 'text-foreground border border-border-subtle hover:bg-bg-secondary hover:border-primary/40',
                primary:
                    'bg-primary text-foreground-inverse hover:bg-primary-hover',
                danger: 'bg-danger text-white hover:bg-danger-hover',
                caution:
                    'bg-caution text-foreground-inverse hover:bg-caution-hover',
                success:
                    'bg-success text-foreground-inverse hover:bg-success-hover',
                nav: 'bg-bg-secondary text-foreground w-12 h-12 p-0 rounded-[1.2rem] transition-all duration-200 hover:bg-primary hover:text-foreground-inverse hover:rounded-[0.75rem]',
                ghost: 'bg-transparent text-foreground hover:bg-bg-subtle border-none shadow-none',
            },
            size: {
                sm: 'px-2 py-1 text-xs',
                md: 'px-xs py-xs text-sm',
                lg: 'px-sm py-sm text-base',
            },
        },
        compoundVariants: Object.entries(mutedClasses).map(
            ([variant, className]) => ({
                variant: variant as keyof typeof mutedClasses,
                loading: true,
                class: className,
            }),
        ),
        defaultVariants: {
            variant: 'normal',
            size: 'md',
        },
    },
);

export interface ButtonProps
    extends
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    children: React.ReactNode;
    loading?: boolean;
    retainSize?: boolean;
    innerClassName?: string;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    variant,
    size,
    loading,
    retainSize,
    innerClassName,
    disabled,
    ...props
}) => {
    const buttonRef = useRef<HTMLButtonElement>(null);
    const [dimensions, setDimensions] = useState<{
        width: number | string;
        height: number | string;
    }>({ width: 'auto', height: 'auto' });

    useLayoutEffect(() => {
        const updateDimensions = (): void => {
            if (!buttonRef.current) return;
            const { width, height } = buttonRef.current.getBoundingClientRect();
            setDimensions((prev) => {
                // if we are already retaining size, or if we are loading,
                // don't update from the current (possibly loading/changed) state.
                if (retainSize && prev.width !== 'auto') return prev;
                if (loading && prev.width !== 'auto') return prev;

                if (prev.width === width && prev.height === height) return prev;
                return { width, height };
            });
        };

        // always measure to have defaults ready, but the setter logic
        // above will prevent overwriting locked dimensions.
        updateDimensions();

        if (retainSize || loading) {
            window.addEventListener('resize', updateDimensions);
            return () => window.removeEventListener('resize', updateDimensions);
        }
    }, [loading, retainSize, children]);

    const dimensionStyles =
        (retainSize || loading) && dimensions.width !== 'auto'
            ? { width: dimensions.width, height: dimensions.height }
            : undefined;

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
                    'flex items-center justify-center gap-inherit',
                    loading ? 'opacity-0' : undefined,
                    innerClassName,
                )}
            >
                {children}
            </span>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <BouncingDots color="bg-current" size={4} />
                </div>
            )}
        </button>
    );
};
