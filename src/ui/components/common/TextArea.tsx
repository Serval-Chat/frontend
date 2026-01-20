import React, { useEffect, useRef } from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

const textAreaVariants = cva(
    'w-full rounded-md border border-border-subtle bg-bg-subtle px-3 py-2 text-sm text-foreground placeholder:text-placeholder focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 transition-all duration-200 resize-none min-h-[40px] max-h-[200px] custom-scrollbar',
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
    },
);

export interface TextAreaProps
    extends
        Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'disabled'>,
        VariantProps<typeof textAreaVariants> {
    autoResize?: boolean;
}

const TextArea = React.forwardRef<HTMLTextAreaElement, TextAreaProps>(
    ({ className, disabled, autoResize = true, ...props }, ref) => {
        const internalRef = useRef<HTMLTextAreaElement>(null);

        React.useImperativeHandle(ref, () => internalRef.current!);

        useEffect(() => {
            if (autoResize && internalRef.current) {
                const textarea = internalRef.current;
                textarea.style.height = 'auto';
                textarea.style.height = `${textarea.scrollHeight}px`;
            }
        }, [props.value, autoResize]);

        return (
            <Box
                as="textarea"
                className={cn(textAreaVariants({ disabled, className }))}
                disabled={disabled || undefined}
                ref={internalRef}
                rows={1}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
            />
        );
    },
);
TextArea.displayName = 'TextArea';

export { TextArea };
