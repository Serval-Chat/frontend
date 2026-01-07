import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

import { ChevronUp, ChevronDown } from 'lucide-react';

const inputVariants = cva(
    'h-10 w-full rounded-md border border-border-subtle bg-bg-subtle px-3 py-2 text-sm text-foreground placeholder:text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-all duration-200',
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
        const internalRef = React.useRef<HTMLInputElement>(null);

        React.useImperativeHandle(ref, () => internalRef.current!);

        const isNumber = type === 'number';

        const handleIncrement = () => {
            if (internalRef.current) {
                internalRef.current.stepUp();
                const event = new Event('input', { bubbles: true });
                internalRef.current.dispatchEvent(event);
            }
        };

        const handleDecrement = () => {
            if (internalRef.current) {
                internalRef.current.stepDown();
                const event = new Event('input', { bubbles: true });
                internalRef.current.dispatchEvent(event);
            }
        };

        return (
            <div
                className="group relative flex items-center w-full"
                style={{ minWidth, maxWidth, ...props.style }}
            >
                <input
                    type={type}
                    disabled={disabled || undefined}
                    className={cn(
                        inputVariants({ disabled, className }),
                        isNumber &&
                            'pr-9 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none'
                    )}
                    ref={internalRef}
                    {...props}
                    style={{ minWidth: 'unset', maxWidth: 'unset' }}
                />

                {isNumber && !disabled && (
                    <div className="absolute right-1 flex flex-col gap-[1px] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                        <button
                            type="button"
                            onClick={handleIncrement}
                            className="p-0.5 hover:bg-white/10 rounded-sm text-foreground-muted hover:text-foreground transition-colors"
                        >
                            <ChevronUp size={14} />
                        </button>
                        <button
                            type="button"
                            onClick={handleDecrement}
                            className="p-0.5 hover:bg-white/10 rounded-sm text-foreground-muted hover:text-foreground transition-colors"
                        >
                            <ChevronDown size={14} />
                        </button>
                    </div>
                )}
            </div>
        );
    }
);
Input.displayName = 'Input';

export { Input };
