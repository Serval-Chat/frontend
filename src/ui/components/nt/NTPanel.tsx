import React from 'react';

import { cn } from '@/utils/cn';

interface NTPanelProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'inset' | 'outset';
    children: React.ReactNode;
}

export const NTPanel = ({
    variant = 'inset',
    className,
    children,
    style,
    ...props
}: NTPanelProps) => {
    const shadow =
        variant === 'inset'
            ? 'inset 1px 1px #808080, inset -1px -1px #ffffff, inset 2px 2px #000000, inset -2px -2px #dfdfdf'
            : 'inset 1px 1px #ffffff, inset -1px -1px #808080';

    const borderStyles =
        variant === 'outset'
            ? {
                  borderTop: '1px solid #dfdfdf',
                  borderLeft: '1px solid #dfdfdf',
                  borderRight: '1px solid #000000',
                  borderBottom: '1px solid #000000',
              }
            : {};

    return (
        <div
            className={cn('bg-[#dfdfdf] p-4 font-nt', className)}
            style={{
                boxShadow: shadow,
                ...borderStyles,
                ...style,
            }}
            {...props}
        >
            {children}
        </div>
    );
};
