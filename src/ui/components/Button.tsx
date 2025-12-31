/**
 * @description A button component. Quite versatile.
 */

import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
    'inline-flex items-center justify-center rounded-md transition-colors duration-300 disabled:pointer-events-none disabled:opacity-50 px-sm py-xs font-sans',
    {
        variants: {
            variant: {
                normal: 'bg-primary text-white hover:bg-primary-hover',
                danger: 'bg-danger text-white hover:bg-danger-hover',
                caution: 'bg-caution text-white hover:bg-caution-hover',
                success: 'bg-success text-white hover:bg-success-hover',
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
}

export const Button: React.FC<ButtonProps> = ({
    children,
    className,
    buttonType,
    loading,
    disabled,
    ...props
}) => {
    const finalVariant = buttonType;

    return (
        <button
            className={cn(
                buttonVariants({ variant: finalVariant, loading, className })
            )}
            disabled={loading || disabled}
            {...props}
        >
            {children}
        </button>
    );
};
