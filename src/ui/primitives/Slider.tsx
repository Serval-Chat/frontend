import React from 'react';

import { cn } from '@/utils/cn';

export interface SliderProps extends Omit<
    React.InputHTMLAttributes<HTMLInputElement>,
    'type'
> {
    ref?: React.Ref<HTMLInputElement>;
    onValueChange?: (value: number) => void;
}

export const Slider = ({
    className,
    value,
    min = 0,
    max = 100,
    onValueChange,
    onChange,
    style,
    ref,
    ...props
}: SliderProps) => {
    const val = Number(value) || 0;
    const minVal = Number(min);
    const maxVal = Number(max);

    const range = maxVal - minVal;
    const percentage = range > 0 ? ((val - minVal) / range) * 100 : 0;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        onChange?.(e);
        onValueChange?.(Number(e.target.value));
    };

    const backgroundStyle = {
        background: `linear-gradient(to right, var(--color-primary) 0%, var(--color-primary) ${percentage}%, var(--bg-subtle) ${percentage}%, var(--bg-subtle) 100%)`,
        ...style,
    };

    return (
        <input
            className={cn('custom-range', className)}
            max={max}
            min={min}
            ref={ref}
            style={backgroundStyle}
            type="range"
            value={value}
            onChange={handleChange}
            {...props}
        />
    );
};

Slider.displayName = 'Slider';
