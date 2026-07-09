import React from 'react';

import { AnimatePresence, m } from 'framer-motion';
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react';
import { createPortal } from 'react-dom';

import { downloadImage } from '@/utils/downloadImage';
import { isTauri } from '@/utils/tauri';

interface ImageLightboxProps {
    src: string;
    alt?: string;
    isOpen: boolean;
    onClose: () => void;
}

export const ImageLightbox = ({
    src,
    alt = 'Image',
    isOpen,
    onClose,
}: ImageLightboxProps): React.ReactPortal | null => {
    const [scale, setScale] = React.useState(1);
    const onCloseEvent = React.useEffectEvent(onClose);

    if (!isOpen && scale !== 1) {
        setScale(1);
    }

    React.useEffect((): (() => void) | undefined => {
        if (!isOpen) return;

        const handleKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') onCloseEvent();
        };
        globalThis.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return (): void => {
            globalThis.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [isOpen]);

    const zoomIn = (e: React.MouseEvent): void => {
        e.stopPropagation();
        setScale((s): number => Math.min(s + 0.5, 4));
    };
    const zoomOut = (e: React.MouseEvent): void => {
        e.stopPropagation();
        setScale((s): number => Math.max(s - 0.5, 0.5));
    };

    const handleDownload = async (): Promise<void> => {
        if (isTauri()) {
            try {
                await downloadImage(src, alt);
            } catch (error) {
                console.error('Tauri download error:', error);
                window.open(src, '_blank');
            }
        } else {
            const link = document.createElement('a');
            link.href = src;
            link.download = alt || 'image';
            document.body.append(link);
            link.click();
            link.remove();
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen ? (
                <div className="fixed inset-0 z-top flex flex-col">
                    {/* Backdrop */}
                    <m.div
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/85 backdrop-blur-md"
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Toolbar */}
                    <div className="relative z-10 flex shrink-0 items-center justify-between border-b border-white/5 bg-black/40 px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 backdrop-blur-md">
                        <span className="max-w-[50%] truncate text-sm font-medium text-white/60">
                            {alt}
                        </span>
                        <div className="flex items-center gap-1 md:gap-2">
                            <button
                                aria-label="Zoom out"
                                className="rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20"
                                type="button"
                                onClick={zoomOut}
                            >
                                <ZoomOut size={20} />
                            </button>
                            <span className="w-12 text-center text-xs text-white/50 tabular-nums">
                                {Math.round(scale * 100)}%
                            </span>
                            <button
                                aria-label="Zoom in"
                                className="rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20"
                                type="button"
                                onClick={zoomIn}
                            >
                                <ZoomIn size={20} />
                            </button>
                            <div className="mx-1 h-4 w-px bg-white/10" />
                            <button
                                aria-label="Download"
                                className="rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20"
                                type="button"
                                onClick={(e): void => {
                                    e.stopPropagation();
                                    void handleDownload();
                                }}
                            >
                                <Download size={20} />
                            </button>
                            <button
                                aria-label="Close"
                                className="ml-1 rounded-md p-2 text-white/70 transition-colors hover:bg-white/10 hover:text-white active:bg-white/20"
                                type="button"
                                onClick={onClose}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Image area */}
                    <button
                        className="relative flex flex-1 items-center justify-center overflow-auto border-0 bg-transparent p-0 focus:outline-none"
                        type="button"
                        onClick={onClose}
                        onKeyDown={(e): void => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                onClose();
                            }
                        }}
                        onWheel={(e): void => {
                            if (e.deltaY < 0) {
                                setScale((s): number => Math.min(s + 0.2, 4));
                            } else {
                                setScale((s): number => Math.max(s - 0.2, 0.5));
                            }
                        }}
                    >
                        <m.img
                            alt={alt}
                            animate={{ opacity: 1, scale }}
                            className="rounded-lg shadow-2xl select-none"
                            exit={{ opacity: 0, scale: 0.95 }}
                            initial={{ opacity: 0, scale: 0.95 }}
                            src={src}
                            style={{
                                maxWidth: '90vw',
                                maxHeight: 'calc(100vh - 120px)',
                                objectFit: 'contain',
                                cursor: scale > 1 ? 'zoom-out' : 'default',
                            }}
                            transition={{
                                type: 'spring',
                                damping: 25,
                                stiffness: 300,
                            }}
                            onClick={(e): void => {
                                e.stopPropagation();
                                if (scale > 1) setScale(1);
                            }}
                        />
                    </button>
                </div>
            ) : null}
        </AnimatePresence>,
        document.body,
    );
};
