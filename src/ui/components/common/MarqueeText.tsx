import React, { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

interface MarqueeTextProps {
    children: React.ReactNode;
    className?: string;
    /** Pixels per second the text scrolls at */
    speed?: number;
}

export const MarqueeText = ({
    children,
    className,
    speed = 30,
}: MarqueeTextProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [shift, setShift] = useState(0);
    const overflow = shift > 0;
    const duration = shift / speed / 0.35;

    useLayoutEffect((): (() => void) => {
        const measure = (): void => {
            if (!containerRef.current || !textRef.current) return;
            const cw = containerRef.current.offsetWidth;
            const tw = textRef.current.scrollWidth;
            setShift(Math.max(0, tw - cw));
        };

        measure();

        const ro = new ResizeObserver(measure);
        if (containerRef.current) ro.observe(containerRef.current);
        return (): void => {
            ro.disconnect();
        };
    }, [children]);

    return (
        <div
            className={cn('overflow-hidden', className)}
            ref={containerRef}
            style={
                overflow
                    ? {
                          maskImage:
                              'linear-gradient(to right, black 70%, transparent 100%)',
                          WebkitMaskImage:
                              'linear-gradient(to right, black 70%, transparent 100%)',
                      }
                    : undefined
            }
        >
            <span
                className={cn(
                    'inline-block whitespace-nowrap',
                    overflow && 'animate-marquee',
                )}
                ref={textRef}
                style={
                    {
                        '--marquee-duration': `${duration}s`,
                        '--marquee-shift': shift,
                    } as React.CSSProperties
                }
            >
                {children}
            </span>
        </div>
    );
};
