import React from 'react';

import { AnimatePresence, motion } from 'framer-motion';
import { Download, X, ZoomIn, ZoomOut } from 'lucide-react';
import { createPortal } from 'react-dom';

import { isTauri } from '@/utils/tauri';

export const downloadImage = async (
    src: string,
    alt: string,
): Promise<void> => {
    const { fetch } = await import('@tauri-apps/plugin-http');
    const { writeFile } = await import('@tauri-apps/plugin-fs');
    const { downloadDir } = await import('@tauri-apps/api/path');
    const { platform } = await import('@tauri-apps/plugin-os');
    const { invoke } = await import('@tauri-apps/api/core');

    const response = await fetch(src, { method: 'GET' });
    if (!response.ok) throw new Error('Download failed');

    const buffer = await response.arrayBuffer();
    const extension = src.split('.').pop()?.split('?')[0] || 'png';
    const filename = `${alt.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_${Date.now()}.${extension}`;
    console.log('Platform: ', platform);
    const os = platform();
    const dir =
        os === 'android' ? '/storage/emulated/0/Download' : await downloadDir();

    await writeFile(`${dir}/${filename}`, new Uint8Array(buffer));
    if (os === 'android') {
        try {
            await invoke('plugin:mediascan|scanFile', {
                path: `${dir}/${filename}`,
            });
        } catch (e) {
            console.error('Failed to trigger media scan:', e);
        }
    }
    console.log('Downloaded to:', `${dir}/${filename}`);
};

interface ImageLightboxProps {
    src: string;
    alt?: string;
    isOpen: boolean;
    onClose: () => void;
}

export const ImageLightbox: React.FC<ImageLightboxProps> = ({
    src,
    alt = 'Image',
    isOpen,
    onClose,
}) => {
    const [scale, setScale] = React.useState(1);

    React.useEffect(() => {
        if (!isOpen) {
            setScale(1);
            return;
        }
        const handleKey = (e: KeyboardEvent): void => {
            if (e.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKey);
        document.body.style.overflow = 'hidden';
        return () => {
            window.removeEventListener('keydown', handleKey);
            document.body.style.overflow = '';
        };
    }, [isOpen, onClose]);

    const zoomIn = (e: React.MouseEvent): void => {
        e.stopPropagation();
        setScale((s) => Math.min(s + 0.5, 4));
    };
    const zoomOut = (e: React.MouseEvent): void => {
        e.stopPropagation();
        setScale((s) => Math.max(s - 0.5, 0.5));
    };

    const handleDownload = async (): Promise<void> => {
        if (isTauri()) {
            try {
                await downloadImage(src, alt);
            } catch (err) {
                console.error('Tauri download error:', err);
                window.open(src, '_blank');
            }
        } else {
            const link = document.createElement('a');
            link.href = src;
            link.download = alt || 'image';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    if (typeof document === 'undefined') return null;

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-top flex flex-col">
                    {/* Backdrop */}
                    <motion.div
                        animate={{ opacity: 1 }}
                        className="absolute inset-0 bg-black/85 backdrop-blur-md"
                        exit={{ opacity: 0 }}
                        initial={{ opacity: 0 }}
                        onClick={onClose}
                    />

                    {/* Toolbar */}
                    <div className="relative z-10 flex items-center justify-between px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-3 shrink-0 bg-black/40 backdrop-blur-md border-b border-white/5">
                        <span className="text-white/60 text-sm truncate max-w-[50%] font-medium">
                            {alt}
                        </span>
                        <div className="flex items-center gap-1 md:gap-2">
                            <button
                                aria-label="Zoom out"
                                className="text-white/70 hover:text-white transition-colors p-2 rounded-md hover:bg-white/10 active:bg-white/20"
                                onClick={zoomOut}
                            >
                                <ZoomOut size={20} />
                            </button>
                            <span className="text-white/50 text-xs w-12 text-center tabular-nums">
                                {Math.round(scale * 100)}%
                            </span>
                            <button
                                aria-label="Zoom in"
                                className="text-white/70 hover:text-white transition-colors p-2 rounded-md hover:bg-white/10 active:bg-white/20"
                                onClick={zoomIn}
                            >
                                <ZoomIn size={20} />
                            </button>
                            <div className="w-px h-4 bg-white/10 mx-1" />
                            <button
                                aria-label="Download"
                                className="text-white/70 hover:text-white transition-colors p-2 rounded-md hover:bg-white/10 active:bg-white/20"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    void handleDownload();
                                }}
                            >
                                <Download size={20} />
                            </button>
                            <button
                                aria-label="Close"
                                className="text-white/70 hover:text-white transition-colors p-2 rounded-md hover:bg-white/10 active:bg-white/20 ml-1"
                                onClick={onClose}
                            >
                                <X size={20} />
                            </button>
                        </div>
                    </div>

                    {/* Image area */}
                    <div
                        className="relative flex-1 flex items-center justify-center overflow-auto focus:outline-none"
                        role="button"
                        tabIndex={0}
                        onClick={onClose}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                onClose();
                            }
                        }}
                        onWheel={(e) => {
                            if (e.deltaY < 0) {
                                setScale((s) => Math.min(s + 0.2, 4));
                            } else {
                                setScale((s) => Math.max(s - 0.2, 0.5));
                            }
                        }}
                    >
                        <motion.img
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
                            onClick={(e) => {
                                e.stopPropagation();
                                if (scale > 1) setScale(1);
                            }}
                        />
                    </div>
                </div>
            )}
        </AnimatePresence>,
        document.body,
    );
};
