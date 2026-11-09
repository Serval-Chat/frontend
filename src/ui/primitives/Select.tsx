import React from 'react';
import type { CSSProperties } from 'react';

import { ChevronDown } from 'lucide-react';

import {
    type InputSize,
    type InputVariant,
    baseInputStyle,
    sizeInputStyle,
    variantInputStyle,
} from '@/ui/primitives/fieldStyles';
import { cn } from '@/utils/cn';

export interface SelectProps extends Omit<
    React.SelectHTMLAttributes<HTMLSelectElement>,
    'size' | 'style'
> {
    ref?: React.Ref<HTMLSelectElement>;
    variant?: InputVariant;
    size?: InputSize;
    style?: CSSProperties;
    wrapperClassName?: string;
}

export const Select = ({
    variant = 'default',
    size = 'md',
    disabled,
    style,
    className,
    wrapperClassName,
    ref,
    children,
    ...props
}: SelectProps) => (
    <div className={cn('relative flex w-full items-center', wrapperClassName)}>
        <select
            className={cn('cursor-pointer appearance-none', className)}
            disabled={disabled || undefined}
            ref={ref}
            style={{
                ...baseInputStyle,
                ...variantInputStyle[variant],
                ...sizeInputStyle[size],
                paddingRight: '2rem',
                ...(disabled ? { cursor: 'not-allowed', opacity: 0.5 } : {}),
                ...style,
            }}
            {...props}
        >
            {children}
        </select>
        <ChevronDown
            aria-hidden
            className="pointer-events-none absolute right-2.5 text-muted-foreground"
            size={16}
        />
    </div>
);
