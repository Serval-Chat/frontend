import React, { useEffect, useRef } from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

import { useSmartPosition } from '@/hooks/useSmartPosition';
import { cn } from '@/utils/cn';

interface PopoverProps {
    isOpen: boolean;
    onClose: () => void;
    triggerRef: React.RefObject<HTMLElement | null>;
    children: React.ReactNode;
    className?: string;
    offset?: number;
    padding?: number;
}

export const Popover = ({
    isOpen,
    onClose,
    triggerRef,
    children,
    className,
    offset = 12,
    padding = 16,
}: PopoverProps): React.ReactPortal => {
    const popoverRef = useRef<HTMLDivElement>(null);
    const coords = useSmartPosition({
        isOpen,
        elementRef: popoverRef,
        triggerRef,
        offset,
        padding,
    });

    useEffect((): (() => void) => {
        const handleClickOutside = (event: MouseEvent): void => {
            if (
                isOpen &&
                popoverRef.current &&
                !popoverRef.current.contains(event.target as Node) &&
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node)
            ) {
                onClose();
            }
        };

        const handleKeyDown = (event: KeyboardEvent): void => {
            if (event.key === 'Escape') {
                onClose();
            }
        };

        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKeyDown);
        }

        return (): void => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, onClose, triggerRef]);

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    className={cn(
                        'fixed z-[var(--z-index-popover)] overflow-hidden rounded-xl border border-border-subtle bg-background shadow-2xl backdrop-blur-md',
                        className,
                    )}
                    exit={{ opacity: 0, scale: 0.95, y: 10 }}
                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                    ref={popoverRef}
                    style={{
                        top: coords.y,
                        left: coords.x,
                    }}
                    transition={{ duration: 0.2, ease: 'easeOut' }}
                >
                    {children}
                </motion.div>
            )}
        </AnimatePresence>,
        document.body,
    );
};
