import React, { useCallback, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
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

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'right',
    className,
    triggerClassName,
    fullWidth = false,
    delay = 100,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();

        let x = 0;
        let y = 0;

        switch (position) {
            case 'right':
                x = rect.right + 8;
                y = rect.top + rect.height / 2;
                break;
            case 'top':
                x = rect.left + rect.width / 2;
                y = rect.top - 8;
                break;
            case 'bottom':
                x = rect.left + rect.width / 2;
                y = rect.bottom + 8;
                break;
            case 'left':
                x = rect.left - 8;
                y = rect.top + rect.height / 2;
                break;
        }

        setCoords({ x, y });
    }, [position]);

    const handleMouseEnter = (): void => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => {
            setIsVisible(true);
            updatePosition();
        }, delay);
    };

    const handleMouseLeave = (): void => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        setIsVisible(false);
    };

    React.useLayoutEffect(() => {
        if (isVisible) {
            updatePosition();
            const hide = (): void => setIsVisible(false);
            window.addEventListener('scroll', hide, true);
            window.addEventListener('resize', hide);
            return () => {
                window.removeEventListener('scroll', hide, true);
                window.removeEventListener('resize', hide);
            };
        }
    }, [isVisible, updatePosition]);

    const variants = {
        right: { x: -5, y: '-50%', opacity: 0, scale: 0.95 },
        top: { x: '-50%', y: '-95%', opacity: 0, scale: 0.95 },
        bottom: { x: '-50%', y: 5, opacity: 0, scale: 0.95 },
        left: { x: '-95%', y: '-50%', opacity: 0, scale: 0.95 },
    };

    const animate = {
        right: { x: 0, y: '-50%', opacity: 1, scale: 1 },
        top: { x: '-50%', y: '-100%', opacity: 1, scale: 1 },
        bottom: { x: '-50%', y: 0, opacity: 1, scale: 1 },
        left: { x: '-100%', y: '-50%', opacity: 1, scale: 1 },
    };

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
            {createPortal(
                <AnimatePresence>
                    {isVisible && (
                        <motion.div
                            animate={animate[position]}
                            className={cn(
                                'pointer-events-none fixed z-[var(--z-index-tooltip)] rounded-lg bg-[#111214] px-3 py-1.5 text-[13px] font-bold whitespace-nowrap text-[#f2f3f5] shadow-2xl',
                                'before:absolute before:border-[6px] before:border-transparent before:content-[""]',
                                position === 'right' &&
                                    'before:top-1/2 before:right-full before:-mr-[1px] before:-translate-y-1/2 before:border-r-[#111214]',
                                position === 'top' &&
                                    'before:top-full before:left-1/2 before:-mt-[1px] before:-translate-x-1/2 before:border-t-[#111214]',
                                position === 'bottom' &&
                                    'before:bottom-full before:left-1/2 before:-mb-[1px] before:-translate-x-1/2 before:border-b-[#111214]',
                                position === 'left' &&
                                    'before:top-1/2 before:left-full before:-ml-[1px] before:-translate-y-1/2 before:border-l-[#111214]',
                                className,
                            )}
                            exit={variants[position]}
                            initial={variants[position]}
                            style={{
                                top: coords.y,
                                left: coords.x,
                            }}
                            transition={{ duration: 0.1, ease: 'easeOut' }}
                        >
                            {content}
                        </motion.div>
                    )}
                </AnimatePresence>,
                document.body,
            )}
        </>
    );
};
