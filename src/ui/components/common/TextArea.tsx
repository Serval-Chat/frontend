import React, { useEffect, useRef } from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

const textAreaVariants = cva(
    'custom-scrollbar max-h-[200px] min-h-[40px] w-full resize-none rounded-md border border-border-subtle bg-bg-subtle px-3 py-2 text-sm text-foreground transition-all duration-200 placeholder:text-placeholder focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-1 focus-visible:outline-none',
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
