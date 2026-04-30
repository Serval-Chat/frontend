import React from 'react';

import { cn } from '@/utils/cn';

interface NTSliderProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    value: number;
    min?: number;
    max?: number;
    step?: number;
    onValueChange?: (value: number) => void;
}

const NT_SLIDER_STYLES = `
    .nt-slider {
        appearance: none;
        width: 100%;
        background: transparent;
        cursor: pointer;
        outline: none;
        margin: 10px 0;
    }

    .nt-slider::-webkit-slider-runnable-track {
        width: 100%;
        height: 4px;
        background: #dfdfdf;
        border-top: 1px solid #808080;
        border-left: 1px solid #808080;
        border-right: 1px solid #ffffff;
        border-bottom: 1px solid #ffffff;
    }

    .nt-slider::-webkit-slider-thumb {
        appearance: none;
        height: 20px;
        width: 11px;
        background: #c0c0c0;
        margin-top: -9px;
        border-top: 1px solid #dfdfdf;
        border-left: 1px solid #dfdfdf;
        border-right: 1px solid #000000;
        border-bottom: 1px solid #000000;
        box-shadow: inset 1px 1px #ffffff, inset -1px -1px #808080;
        position: relative;
        z-index: 2;
    }

    .nt-slider:active::-webkit-slider-thumb {
        /* No specific active state in NT usually, just stays the same */
    }

    .nt-slider::-moz-range-track {
        width: 100%;
        height: 4px;
        background: #dfdfdf;
        border-top: 1px solid #808080;
        border-left: 1px solid #808080;
        border-right: 1px solid #ffffff;
        border-bottom: 1px solid #ffffff;
    }

    .nt-slider::-moz-range-thumb {
        height: 20px;
        width: 11px;
        background: #c0c0c0;
        border-top: 1px solid #dfdfdf;
        border-left: 1px solid #dfdfdf;
        border-right: 1px solid #000000;
        border-bottom: 1px solid #000000;
        box-shadow: inset 1px 1px #ffffff, inset -1px -1px #808080;
        border-radius: 0;
    }
`;

export const NTSlider: React.FC<NTSliderProps> = ({
    label,
    value,
    min = 0,
    max = 100,
    step = 1,
    onValueChange,
    className,
    ...props
}) => (
    <div className={cn('flex flex-col gap-1', className)}>
        <style>{NT_SLIDER_STYLES}</style>
        {label && (
            <div className="flex justify-between">
                <span className="font-nt text-[11px] font-bold text-black">
                    {label}
                </span>
                <span className="font-nt text-[11px] font-bold text-black">
                    {value}
                </span>
            </div>
        )}
        <input
            className="nt-slider"
            max={max}
            min={min}
            step={step}
            type="range"
            value={value}
            onChange={(e) => onValueChange?.(Number(e.target.value))}
            {...props}
        />
    </div>
);
