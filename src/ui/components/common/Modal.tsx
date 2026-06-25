import React from 'react';

import { AnimatePresence, m } from 'framer-motion';
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
    mobileFullScreen?: boolean;
    wrapperClassName?: string;
    zIndex?: number;
}

/**
 * @description A modal component
 */
export const Modal = ({
    isOpen,
    onClose,
    title,
    children,
    className,
    showCloseButton = true,
    noPadding = false,
    fullScreen = false,
    mobileFullScreen = false,
    wrapperClassName,
    zIndex,
}: ModalProps): React.ReactPortal | null => {
    const onCloseRef = React.useRef(onClose);
    React.useLayoutEffect(() => {
        onCloseRef.current = onClose;
    });

    React.useEffect((): (() => void) => {
        const handleKeyDown = (e: KeyboardEvent): void => {
            if (e.key === 'Escape' && isOpen) {
                onCloseRef.current();
            }
        };

        if (isOpen) {
            window.addEventListener('keydown', handleKeyDown);
            document.body.style.overflow = 'hidden';
        }

        return (): void => {
            window.removeEventListener('keydown', handleKeyDown);
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div
                    className={cn(
                        'fixed inset-0 z-modal flex items-center justify-center',
                        !fullScreen && 'p-4',
                        mobileFullScreen && 'p-0 md:p-4',
                        wrapperClassName,
                    )}
                    style={{ zIndex }}
                >
                    <m.div
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        onClick={onClose}
                    />
                    <m.div
                        animate={
                            fullScreen
                                ? { opacity: 1 }
                                : { opacity: 1, scale: 1, y: 0 }
                        }
                        className={cn(
                            'relative flex w-full flex-col overflow-hidden rounded-xl border border-border-subtle bg-background shadow-2xl',
                            fullScreen
                                ? 'max-h-none w-screen max-w-none rounded-none border-none'
                                : 'max-h-[90vh] max-w-2xl',
                            mobileFullScreen &&
                                'mt-[env(safe-area-inset-top)] mb-[env(safe-area-inset-bottom)] h-[calc(100dvh-env(safe-area-inset-top)-env(safe-area-inset-bottom))] max-h-none w-screen max-w-none rounded-none border-none md:mt-0 md:mb-0 md:h-auto md:max-h-[90vh] md:rounded-xl md:border',
                            className,
                        )}
                        exit={
                            fullScreen
                                ? { opacity: 0 }
                                : { opacity: 0, scale: 0.95, y: 20 }
                        }
                        initial={
                            fullScreen
                                ? { opacity: 0 }
                                : { opacity: 0, scale: 0.95, y: 20 }
                        }
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
                    </m.div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
};
