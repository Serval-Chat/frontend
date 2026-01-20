import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '@/utils/cn';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    showCloseButton?: boolean;
    noPadding?: boolean;
}

/**
 * @description A modal component
 */
export const Modal: React.FC<ModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    className,
    showCloseButton = true,
    noPadding = false,
}) => {
    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-modal flex items-center justify-center p-4">
                    <motion.div
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <motion.div
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className={cn(
                            'relative w-full max-w-2xl bg-[var(--color-background)] rounded-xl shadow-2xl border border-[var(--color-border-subtle)] overflow-hidden flex flex-col max-h-[90vh]',
                            className
                        )}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                        }}
                    >
                        {(title || showCloseButton) && (
                            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-subtle)] shrink-0 bg-[var(--color-bg-subtle)]">
                                {title && (
                                    <h2 className="text-lg font-bold text-foreground">
                                        {title}
                                    </h2>
                                )}
                                {showCloseButton && (
                                    <button
                                        className="p-1 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors"
                                        onClick={onClose}
                                    >
                                        <X size={20} />
                                    </button>
                                )}
                            </div>
                        )}
                        <div
                            className={cn(
                                'flex-1 overflow-y-auto custom-scrollbar',
                                !noPadding && 'p-6'
                            )}
                        >
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};
