import React, { useCallback, useRef, useState } from 'react';

import { AnimatePresence, m } from 'framer-motion';
import { createPortal } from 'react-dom';

import { cn } from '@/utils/cn';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'right' | 'top' | 'bottom' | 'left';
    className?: string;
    triggerClassName?: string;
    fullWidth?: boolean;
    delay?: number;
}

const TOOLTIP_MEDIA_QUERY =
    '(hover: hover) and (pointer: fine) and (min-width: 768px)';
const TOOLTIP_INITIAL_VARIANTS = {
    right: { x: -5, y: '-50%', opacity: 0, scale: 0.95 },
    top: { x: '-50%', y: '-95%', opacity: 0, scale: 0.95 },
    bottom: { x: '-50%', y: 5, opacity: 0, scale: 0.95 },
    left: { x: '-95%', y: '-50%', opacity: 0, scale: 0.95 },
};
const TOOLTIP_ANIMATE_VARIANTS = {
    right: { x: 0, y: '-50%', opacity: 1, scale: 1 },
    top: { x: '-50%', y: '-100%', opacity: 1, scale: 1 },
    bottom: { x: '-50%', y: 0, opacity: 1, scale: 1 },
    left: { x: '-100%', y: '-50%', opacity: 1, scale: 1 },
};

const useTooltipsEnabled = (): boolean => {
    const [isEnabled, setIsEnabled] = useState((): boolean => {
        if (typeof window === 'undefined') return false;
        return window.matchMedia(TOOLTIP_MEDIA_QUERY).matches;
    });

    React.useEffect((): (() => void) | undefined => {
        if (typeof window === 'undefined') return undefined;

        const query = window.matchMedia(TOOLTIP_MEDIA_QUERY);
        const handleChange = (): void => setIsEnabled(query.matches);

        query.addEventListener('change', handleChange);

        return (): void => query.removeEventListener('change', handleChange);
    }, []);

    return isEnabled;
};

const TOOLTIP_ESTIMATED_W = 280;
const TOOLTIP_ESTIMATED_H = 36;

type TooltipPosition = 'right' | 'top' | 'bottom' | 'left';

function resolvePosition(
    rect: DOMRect,
    preferred: TooltipPosition,
): { pos: TooltipPosition; x: number; y: number } {
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const GAP = 8;

    const candidates: TooltipPosition[] = [
        preferred,
        preferred === 'right'
            ? 'left'
            : preferred === 'left'
              ? 'right'
              : preferred === 'top'
                ? 'bottom'
                : 'top',
        'bottom',
        'top',
        'right',
        'left',
    ];

    for (const pos of candidates) {
        let x = 0;
        let y = 0;

        switch (pos) {
            case 'right':
                x = rect.right + GAP;
                y = rect.top + rect.height / 2;
                if (x + TOOLTIP_ESTIMATED_W > vw) continue;
                break;
            case 'left':
                x = rect.left - GAP;
                y = rect.top + rect.height / 2;
                if (x - TOOLTIP_ESTIMATED_W < 0) continue;
                break;
            case 'top':
                x = rect.left + rect.width / 2;
                y = rect.top - GAP;
                if (y - TOOLTIP_ESTIMATED_H < 0) continue;
                break;
            case 'bottom':
                x = rect.left + rect.width / 2;
                y = rect.bottom + GAP;
                if (y + TOOLTIP_ESTIMATED_H > vh) continue;
                break;
        }

        return { pos, x, y };
    }

    // Fallback: bottom
    return {
        pos: 'bottom',
        x: rect.left + rect.width / 2,
        y: rect.bottom + GAP,
    };
}

export const Tooltip = ({
    content,
    children,
    position = 'right',
    className,
    triggerClassName,
    fullWidth = false,
    delay = 100,
}: TooltipProps) => {
    const tooltipsEnabled = useTooltipsEnabled();
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const [effectivePosition, setEffectivePosition] =
        useState<TooltipPosition>(position);
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const updatePosition = useCallback((): void => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();
        const { pos, x, y } = resolvePosition(rect, position);
        setEffectivePosition(pos);
        setCoords({ x, y });
    }, [position]);

    const handleMouseEnter = (): void => {
        if (!tooltipsEnabled) return;

        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout((): void => {
            setIsVisible(true);
            updatePosition();
        }, delay);
    };

    const handleMouseLeave = (): void => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    const showTooltip = tooltipsEnabled && isVisible;

    React.useEffect((): void => {
        if (!tooltipsEnabled && timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
    }, [tooltipsEnabled]);

    React.useEffect(
        (): (() => void) => (): void => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        },
        [],
    );

    React.useLayoutEffect((): (() => void) | undefined => {
        if (showTooltip) {
            updatePosition();
            const hide = (): void => setIsVisible(false);
            window.addEventListener('scroll', hide, true);
            window.addEventListener('resize', hide);
            return (): void => {
                window.removeEventListener('scroll', hide, true);
                window.removeEventListener('resize', hide);
            };
        }
    }, [showTooltip, updatePosition]);

    return (
        <>
            <div
                className={cn(
                    'relative',
                    fullWidth ? 'block w-full' : 'inline-block',
                    triggerClassName,
                )}
                ref={triggerRef}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
            >
                {children}
            </div>
            {tooltipsEnabled &&
                createPortal(
                    <AnimatePresence>
                        {showTooltip && (
                            <m.div
                                animate={
                                    TOOLTIP_ANIMATE_VARIANTS[effectivePosition]
                                }
                                className={cn(
                                    'pointer-events-none fixed z-[var(--z-index-tooltip)] rounded-lg bg-[#111214] px-3 py-1.5 text-[13px] font-bold whitespace-nowrap text-[#f2f3f5] shadow-2xl',
                                    'before:absolute before:border-[6px] before:border-transparent before:content-[""]',
                                    effectivePosition === 'right' &&
                                        'before:top-1/2 before:right-full before:-mr-[1px] before:-translate-y-1/2 before:border-r-[#111214]',
                                    effectivePosition === 'top' &&
                                        'before:top-full before:left-1/2 before:-mt-[1px] before:-translate-x-1/2 before:border-t-[#111214]',
                                    effectivePosition === 'bottom' &&
                                        'before:bottom-full before:left-1/2 before:-mb-[1px] before:-translate-x-1/2 before:border-b-[#111214]',
                                    effectivePosition === 'left' &&
                                        'before:top-1/2 before:left-full before:-ml-[1px] before:-translate-y-1/2 before:border-l-[#111214]',
                                    className,
                                )}
                                exit={
                                    TOOLTIP_INITIAL_VARIANTS[effectivePosition]
                                }
                                initial={
                                    TOOLTIP_INITIAL_VARIANTS[effectivePosition]
                                }
                                style={{
                                    top: coords.y,
                                    left: coords.x,
                                }}
                                transition={{ duration: 0.1, ease: 'easeOut' }}
                            >
                                {content}
                            </m.div>
                        )}
                    </AnimatePresence>,
                    document.body,
                )}
        </>
    );
};
