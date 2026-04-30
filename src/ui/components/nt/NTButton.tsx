import React from 'react';

import { cn } from '@/utils/cn';

interface NTButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const NTButton: React.FC<NTButtonProps> = ({
    children,
    className,
    ...props
}) => (
    <button
        className={cn(
            'bg-[#c0c0c0] px-4 py-1 font-nt text-[11px] font-bold text-black active:pt-[2px] active:pl-[2px]',
            className,
        )}
        style={{
            borderTop: '1px solid #dfdfdf',
            borderLeft: '1px solid #dfdfdf',
            borderRight: '1px solid #000000',
            borderBottom: '1px solid #000000',
            boxShadow: 'inset 1px 1px #ffffff, inset -1px -1px #808080',
        }}
        type="button"
        {...props}
    >
        {children}
    </button>
);
