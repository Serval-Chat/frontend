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
                            'relative flex w-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-background shadow-2xl',
                            fullScreen
                                ? 'max-h-none w-screen max-w-none rounded-none border-none'
                                : 'max-h-[90vh] max-w-2xl',
                            className,
                        )}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        style={
                            fullScreen
                                ? {
                                      height: 'calc(100dvh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
                                      marginTop: 'env(safe-area-inset-top)',
                                      marginBottom:
                                          'env(safe-area-inset-bottom)',
                                  }
                                : undefined
                        }
                        transition={{
                            type: 'spring',
                            damping: 25,
                            stiffness: 300,
                        }}
                    >
                        {(title || showCloseButton) && (
                            <div className="flex shrink-0 items-center justify-between border-b border-border-subtle bg-bg-subtle px-6 py-4">
                                {title && (
                                    <h2 className="text-lg font-bold text-foreground">
                                        {title}
                                    </h2>
                                )}
                                {showCloseButton && (
                                    <Button
                                        className="h-8 w-8 min-w-0 rounded-md border-none p-1 text-muted-foreground shadow-none transition-colors hover:bg-white/10 hover:text-foreground"
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
                                'custom-scrollbar flex-1 overflow-y-auto',
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
