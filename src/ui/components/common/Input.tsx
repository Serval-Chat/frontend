import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const inputVariants = cva(
    'h-10 w-full rounded-md border border-border-subtle bg-bg-subtle px-3 py-2 text-sm text-foreground placeholder:text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 transition-all duration-200',
    {
        variants: {
            disabled: {
                true: 'cursor-not-allowed opacity-50',
                false: '',
            },
        },
        defaultVariants: {
            disabled: false,
        },
    }
);

export interface InputProps
    extends
        Omit<React.InputHTMLAttributes<HTMLInputElement>, 'disabled'>,
        VariantProps<typeof inputVariants> {
    minWidth?: number | string;
    maxWidth?: number | string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, disabled, type, minWidth, maxWidth, ...props }, ref) => {
        return (
            <input
                type={type}
                disabled={disabled || undefined}
                className={cn(inputVariants({ disabled, className }))}
                style={{
                    minWidth,
                    maxWidth,
                    ...props.style,
                }}
                ref={ref}
                {...props}
            />
        );
    }
);
Input.displayName = 'Input';

export { Input };
