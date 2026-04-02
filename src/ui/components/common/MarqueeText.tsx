import React, { useLayoutEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

interface MarqueeTextProps {
    children: React.ReactNode;
    className?: string;
    /** Pixels per second the text scrolls at */
    speed?: number;
}

/**
 * @description Renders text that scrolls horizontally when it overflows its container.
 */
export const MarqueeText: React.FC<MarqueeTextProps> = ({
    children,
    className,
    speed = 30,
}) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const [overflow, setOverflow] = useState(false);
    const [duration, setDuration] = useState(5);

    useLayoutEffect(() => {
        const measure = () => {
            if (!containerRef.current || !textRef.current) return;
            const cw = containerRef.current.offsetWidth;
            const tw = textRef.current.scrollWidth;
            if (tw > cw) {
                setOverflow(true);
                setDuration(tw / speed);
            } else {
                setOverflow(false);
            }
        };

        measure();

        const ro = new ResizeObserver(measure);
        if (containerRef.current) ro.observe(containerRef.current);
        return () => ro.disconnect();
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
                    } as React.CSSProperties
                }
            >
                {children}
                {overflow && (
                    <span className="inline-block w-12">{children}</span>
                )}
            </span>
        </div>
    );
};
