import React, { useEffect, useRef } from 'react';

import { type VariantProps, cva } from 'class-variance-authority';

import { Box } from '@/ui/components/layout/Box';
import { cn } from '@/utils/cn';

const textAreaWrapperVariants = cva(
    'overflow-hidden rounded-md border border-border-subtle bg-bg-subtle transition-all duration-200 focus-within:ring-2 focus-within:ring-primary focus-within:ring-offset-1',
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

const textAreaVariants =
    'custom-scrollbar block max-h-[200px] min-h-[40px] w-full resize-none border-0 bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-placeholder focus:outline-none';

export interface TextAreaProps
    extends
        Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, 'disabled'>,
        VariantProps<typeof textAreaWrapperVariants> {
    ref?: React.Ref<HTMLTextAreaElement>;
    autoResize?: boolean;
}

const TextArea = ({
    className,
    disabled,
    autoResize = true,
    ref,
    ...props
}: TextAreaProps) => {
    const internalRef = useRef<HTMLTextAreaElement>(null);

    React.useImperativeHandle(
        ref,
        (): HTMLTextAreaElement => internalRef.current!,
    );

    useEffect((): void => {
        if (autoResize && internalRef.current) {
            const textarea = internalRef.current;
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, [props.value, autoResize]);

    return (
        <Box
            className={cn(textAreaWrapperVariants({ disabled, className }))}
        >
            <Box
                as="textarea"
                className={textAreaVariants}
                disabled={disabled || undefined}
                ref={internalRef}
                rows={1}
                // eslint-disable-next-line react/jsx-props-no-spreading
                {...props}
            />
        </Box>
    );
};
TextArea.displayName = 'TextArea';

export { TextArea };
