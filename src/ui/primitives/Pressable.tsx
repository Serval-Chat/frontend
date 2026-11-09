import React from 'react';

import { cn } from '@/utils/cn';

export interface PressableProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    ref?: React.Ref<HTMLButtonElement>;
}

export const Pressable = ({
    type = 'button',
    className,
    ref,
    children,
    ...props
}: PressableProps) => (
    <button
        className={cn(
            'appearance-none border-0 bg-transparent p-0 font-[inherit] text-inherit enabled:cursor-pointer',
            'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary',
            className,
        )}
        ref={ref}
        type={type}
        {...props}
    >
        {children}
    </button>
);
