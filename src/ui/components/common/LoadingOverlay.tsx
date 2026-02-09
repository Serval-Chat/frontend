import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { createPortal } from 'react-dom';

import { cn } from '@/utils/cn';

import { LoadingSpinner } from './LoadingSpinner';

interface LoadingOverlayProps {
    isOpen: boolean;
    message?: string;
    transparent?: boolean;
    blur?: boolean;
    containerRef?: React.RefObject<HTMLElement | null>;
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
    isOpen,
    message = 'Processing...',
    transparent = false,
    blur = true,
    containerRef,
}) => {
    const content = (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    animate={{ opacity: 1 }}
                    className={cn(
                        'flex flex-col items-center justify-center p-6 text-center z-[9999]',
                        containerRef ? 'absolute inset-0' : 'fixed inset-0',
                        !transparent && 'bg-black/60',
                        blur && 'backdrop-blur-sm',
                    )}
                    exit={{ opacity: 0 }}
                    initial={{ opacity: 0 }}
                >
                    <motion.div
                        animate={{ scale: 1, y: 0 }}
                        className="flex flex-col items-center gap-4"
                        exit={{ scale: 0.9, y: 10 }}
                        initial={{ scale: 0.9, y: 10 }}
                    >
                        <div className="relative">
                            <LoadingSpinner
                                className="border-primary"
                                size="lg"
                            />
                            <div className="absolute inset-0 animate-ping rounded-full border border-primary/20" />
                        </div>
                        {message && (
                            <span className="text-sm font-black uppercase tracking-[0.2em] text-white drop-shadow-md">
                                {message}
                            </span>
                        )}
                    </motion.div>
                </motion.div>
            )}
        </AnimatePresence>
    );

    if (containerRef) {
        return content;
    }

    return createPortal(content, document.body);
};
