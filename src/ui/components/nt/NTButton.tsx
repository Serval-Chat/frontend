import React from 'react';

import { cn } from '@/utils/cn';

interface NTButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
}

export const NTButton: React.FC<NTButtonProps> = ({
    children,
    className,
    style,
    ...props
}) => (
    <button
        className={cn(
            'nt-button group bg-[#c0c0c0] px-4 py-1 font-nt text-[11px] leading-[13px] font-bold text-black',
            className,
        )}
        style={style}
        type="button"
        {...props}
    >
        <span className="block group-active:translate-x-px group-active:translate-y-px">
            {children}
        </span>
    </button>
);
