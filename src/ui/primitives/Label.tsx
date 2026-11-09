import React from 'react';

import { cn } from '@/utils/cn';

export type LabelVariant = 'field' | 'inline';

export interface LabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    variant?: LabelVariant;
}

const variantClass: Record<LabelVariant, string> = {
    field: 'text-xs font-bold tracking-wider text-muted-foreground uppercase',
    inline: 'inline-flex items-center gap-2 text-sm text-foreground',
};

export const Label = ({
    variant = 'field',
    className,
    children,
    ...props
}: LabelProps) => (
    <label className={cn(variantClass[variant], className)} {...props}>
        {children}
    </label>
);
