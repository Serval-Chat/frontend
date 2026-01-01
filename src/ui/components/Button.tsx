/**
 * @description A button component. Quite versatile.
 */

import React, { useLayoutEffect, useRef, useState } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';
import { BouncingDots } from '@/ui/animations/BouncingDots';

const mutedClasses = {
    normal: 'bg-primary-muted text-primary-muted-text hover:bg-primary-muted',
    danger: 'bg-danger-muted text-danger-muted-text hover:bg-danger-muted',
    caution: 'bg-caution-muted text-caution-muted-text hover:bg-caution-muted',
    success: 'bg-success-muted text-success-muted-text hover:bg-success-muted',
};

const buttonVariants = cva(
    'px-xs py-xs inline-flex items-center justify-center rounded-md transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50 font-sans whitespace-nowrap',
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
        },
        compoundVariants: Object.entries(mutedClasses).map(
            ([variant, className]) => ({
                variant: variant as keyof typeof mutedClasses,
                loading: true,
                class: className,
            })
        ),
        defaultVariants: {
            variant: 'normal',
        },
    }
);

export interface ButtonProps
    extends
        React.ButtonHTMLAttributes<HTMLButtonElement>,
        VariantProps<typeof buttonVariants> {
    children: React.ReactNode;
    loading?: boolean;
    retainSize?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    variant,
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
        const updateDimensions = () => {
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
            ref={buttonRef}
            aria-busy={loading || undefined}
            style={dimensionStyles}
            className={cn(
                'relative',
                buttonVariants({ variant: variant }),
                className
            )}
            disabled={loading || disabled}
            {...props}
        >
            <span className={loading ? 'opacity-0' : undefined}>
                {children}
            </span>
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center">
                    <BouncingDots size={4} color="bg-current" />
                </div>
            )}
        </button>
    );
};
