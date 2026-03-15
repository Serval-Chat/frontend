import React, { useCallback, useRef, useState } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

import { cn } from '@/utils/cn';

interface TooltipProps {
    content: string;
    children: React.ReactNode;
    position?: 'right' | 'top' | 'bottom' | 'left';
    className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
    content,
    children,
    position = 'right',
    className,
}) => {
    const [isVisible, setIsVisible] = useState(false);
    const [coords, setCoords] = useState({ x: 0, y: 0 });
    const triggerRef = useRef<HTMLDivElement>(null);

    const updatePosition = useCallback(() => {
        if (!triggerRef.current) return;
        const rect = triggerRef.current.getBoundingClientRect();

        let x = 0;
        let y = 0;

        switch (position) {
            case 'right':
                x = rect.right + 12;
                y = rect.top + rect.height / 2;
                break;
            case 'top':
                x = rect.left + rect.width / 2;
                y = rect.top - 12;
                break;
            case 'bottom':
                x = rect.left + rect.width / 2;
                y = rect.bottom + 12;
                break;
            case 'left':
                x = rect.left - 12;
                y = rect.top + rect.height / 2;
                break;
        }

        setCoords({ x, y });
    }, [position]);

    React.useLayoutEffect(() => {
        if (isVisible) {
            updatePosition();
            window.addEventListener('scroll', updatePosition);
            window.addEventListener('resize', updatePosition);
        }
        return () => {
            window.removeEventListener('scroll', updatePosition);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isVisible, updatePosition]);

    const variants = {
        right: { x: 5, y: '-50%', opacity: 0, scale: 0.9 },
        top: { x: '-50%', y: -5, opacity: 0, scale: 0.9 },
        bottom: { x: '-50%', y: 5, opacity: 0, scale: 0.9 },
        left: { x: -5, y: '-50%', opacity: 0, scale: 0.9 },
    };

    return (
        <>
            <div
                className="inline-block"
                ref={triggerRef}
                onMouseEnter={() => setIsVisible(true)}
                onMouseLeave={() => setIsVisible(false)}
            >
                {children}
            </div>
            {isVisible &&
                createPortal(
                    <AnimatePresence>
                        <motion.div
                            animate={{
                                x:
                                    position === 'right' || position === 'left'
                                        ? 0
                                        : '-50%',
                                y:
                                    position === 'top' || position === 'bottom'
                                        ? 0
                                        : '-50%',
                                opacity: 1,
                                scale: 1,
                            }}
                            className={cn(
                                'pointer-events-none fixed z-[var(--z-index-tooltip)] rounded-lg bg-[#111214] px-4 py-2 text-sm font-bold whitespace-nowrap text-[#f2f3f5] shadow-2xl',
                                'before:absolute before:border-[6px] before:border-transparent',
                                position === 'right' &&
                                    'before:top-1/2 before:right-full before:-translate-y-1/2 before:border-r-[#111214]',
                                position === 'top' &&
                                    'before:top-full before:left-1/2 before:-translate-x-1/2 before:border-t-[#111214]',
                                position === 'bottom' &&
                                    'before:bottom-full before:left-1/2 before:-translate-x-1/2 before:border-b-[#111214]',
                                position === 'left' &&
                                    'before:top-1/2 before:left-full before:-translate-y-1/2 before:border-l-[#111214]',
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
                    </AnimatePresence>,
                    document.body,
                )}
        </>
    );
};
