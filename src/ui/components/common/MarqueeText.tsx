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
    const [overflow, setOverflow] = useState(false);
    const [duration, setDuration] = useState(5);
    const [shift, setShift] = useState(0);

    useLayoutEffect((): (() => void) => {
        const measure = (): void => {
            if (!containerRef.current || !textRef.current) return;
            const cw = containerRef.current.offsetWidth;
            const tw = textRef.current.scrollWidth;
            if (tw > cw) {
                const overflowPx = tw - cw;
                setOverflow(true);
                setShift(overflowPx);
                const scrollTime = overflowPx / speed;
                const totalDuration = scrollTime / 0.35;
                setDuration(totalDuration);
            } else {
                setOverflow(false);
                setShift(0);
            }
        };

        measure();

        const ro = new ResizeObserver(measure);
        if (containerRef.current) ro.observe(containerRef.current);
        return (): void => {
            ro.disconnect();
        };
    }, [children, speed]);

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
