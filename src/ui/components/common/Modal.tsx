import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { X } from 'lucide-react';
import { createPortal } from 'react-dom';

import { cn } from '@/utils/cn';

import { Button } from './Button';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    title?: string;
    children: React.ReactNode;
    className?: string;
    showCloseButton?: boolean;
    noPadding?: boolean;
    fullScreen?: boolean;
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
    fullScreen = false,
}) => {
    React.useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            if (e.key === 'Escape' && isOpen) {
                onClose();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return () => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className={cn(
                        'fixed inset-0 z-modal flex items-center justify-center',
                        !fullScreen && 'p-4',
                    )}
                >
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
                            'relative w-full bg-[var(--color-background)] rounded-xl shadow-2xl border border-[var(--color-border-subtle)] overflow-hidden flex flex-col',
                            fullScreen
                                ? 'max-w-none w-screen h-[100dvh] max-h-none rounded-none border-none'
                                : 'max-w-2xl max-h-[90vh]',
                            className,
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
                                    <Button
                                        className="p-1 min-w-0 h-8 w-8 rounded-md hover:bg-white/10 text-muted-foreground hover:text-foreground transition-colors border-none shadow-none"
                                        size="sm"
                                        variant="ghost"
                                        onClick={onClose}
                                    >
                                        <X size={20} />
                                    </Button>
                                )}
                            </div>
                        )}
                        <div
                            className={cn(
                                'flex-1 overflow-y-auto custom-scrollbar',
                                !noPadding && 'p-6',
                            )}
                        >
                            {children}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
};
