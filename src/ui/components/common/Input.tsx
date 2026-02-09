import React from 'react';

import { type VariantProps, cva } from 'class-variance-authority';
import { ChevronDown, ChevronUp } from 'lucide-react';

import { Button } from '@/ui/components/common/Button';
import { cn } from '@/utils/cn';

const inputVariants = cva(
    'w-full text-sm text-foreground placeholder:text-placeholder transition-all duration-200 outline-none disabled:cursor-not-allowed disabled:opacity-50',
    {
        variants: {
            variant: {
                default:
                    'h-10 rounded-md border border-border-subtle bg-bg-subtle px-3 py-2 focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1',
                admin: 'h-11 rounded-xl border border-border-subtle bg-background px-4 py-2.5 focus:border-primary/50 focus:ring-2 focus:ring-primary/10',
            },
        },
        defaultVariants: {
            variant: 'default',
        },
    },
);

export interface InputProps
    extends
        React.InputHTMLAttributes<HTMLInputElement>,
        VariantProps<typeof inputVariants> {
    minWidth?: number | string;
    maxWidth?: number | string;
    disabled?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
    (
        { className, variant, type, minWidth, maxWidth, disabled, ...props },
        ref,
    ) => {
        const internalRef = React.useRef<HTMLInputElement>(null);

        React.useImperativeHandle(ref, () => internalRef.current!);

        const isNumber = type === 'number';

        const handleIncrement = (): void => {
            if (internalRef.current) {
                internalRef.current.stepUp();
                const event = new Event('input', { bubbles: true });
                internalRef.current.dispatchEvent(event);
            }
        };

        const handleDecrement = (): void => {
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
                    className={cn(
                        inputVariants({ variant, className }),
                        isNumber && 'pr-9 [appearance:textfield]',
                    )}
                    disabled={disabled || undefined}
                    ref={internalRef}
                    type={type}
                    {...props}
                    style={{ minWidth: 'unset', maxWidth: 'unset' }}
                />

                {isNumber && !disabled && (
                    <div className="absolute right-1 flex flex-col gap-[1px] opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity">
                        <Button
                            className="h-4 w-5 p-0 hover:bg-white/10 rounded-sm text-foreground-muted hover:text-foreground transition-colors border-none bg-transparent shadow-none"
                            size="sm"
                            type="button"
                            variant="ghost"
                            onClick={handleIncrement}
                        >
                            <ChevronUp size={14} />
                        </Button>
                        <Button
                            className="h-4 w-5 p-0 hover:bg-white/10 rounded-sm text-foreground-muted hover:text-foreground transition-colors border-none bg-transparent shadow-none"
                            size="sm"
                            type="button"
                            variant="ghost"
                            onClick={handleDecrement}
                        >
                            <ChevronDown size={14} />
                        </Button>
                    </div>
                )}
            </div>
        );
    },
);
Input.displayName = 'Input';

export { Input };
