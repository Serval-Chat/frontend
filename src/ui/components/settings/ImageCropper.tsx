import React, { useCallback, useEffect, useRef, useState } from 'react';

import { cn } from '@/utils/cn';

interface CropSelection {
    x: number;
    y: number;
    width: number;
    height: number;
}

interface ImageCropperProps {
    imageFile: File;
    aspectRatio?: number;
    onCropChange: (crop: CropSelection) => void;
    className?: string;
}

type HandleType = 'nw' | 'n' | 'ne' | 'w' | 'e' | 'sw' | 's' | 'se' | 'move';

const getHandlePositions = (
    selection: CropSelection,
): { t: HandleType; x: number; y: number }[] => [
    { t: 'nw', x: selection.x, y: selection.y },
    { t: 'n', x: selection.x + selection.width / 2, y: selection.y },
    { t: 'ne', x: selection.x + selection.width, y: selection.y },
    { t: 'w', x: selection.x, y: selection.y + selection.height / 2 },
    {
        t: 'e',
        x: selection.x + selection.width,
        y: selection.y + selection.height / 2,
    },
    { t: 'sw', x: selection.x, y: selection.y + selection.height },
    {
        t: 's',
        x: selection.x + selection.width / 2,
        y: selection.y + selection.height,
    },
    {
        t: 'se',
        x: selection.x + selection.width,
        y: selection.y + selection.height,
    },
];

const drawCropCanvas = (
    canvas: HTMLCanvasElement,
    image: HTMLImageElement,
    displaySize: { width: number; height: number },
    selection: CropSelection,
): void => {
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    canvas.width = displaySize.width * dpr;
    canvas.height = displaySize.height * dpr;
    ctx.scale(dpr, dpr);

    ctx.drawImage(image, 0, 0, displaySize.width, displaySize.height);

    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, displaySize.width, displaySize.height);

    ctx.globalCompositeOperation = 'destination-out';
    ctx.fillRect(selection.x, selection.y, selection.width, selection.height);
    ctx.globalCompositeOperation = 'source-over';

    ctx.strokeStyle = '#3b82f6';
    ctx.lineWidth = 2;
    ctx.strokeRect(selection.x, selection.y, selection.width, selection.height);

    ctx.fillStyle = '#3b82f6';
    const hs = 8;
    for (const p of getHandlePositions(selection)) {
        ctx.beginPath();
        ctx.arc(p.x, p.y, hs / 2, 0, Math.PI * 2);
        ctx.fill();
    }
};

export const ImageCropper = ({
    imageFile,
    aspectRatio,
    onCropChange,
    className,
}: ImageCropperProps) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);

    const [image, setImage] = useState<HTMLImageElement | null>(null);
    const [displaySize, setDisplaySize] = useState({ width: 0, height: 0 });
    // drawn imperatively into the <canvas> below (see the draw effect further
    // down) rather than interpolated into JSX, so it IS rendered on screen even
    // though the static "never shown" heuristic can't see that - switching this
    // to a ref would stop the draw effect from re-running when it changes.
    // react-doctor-disable-next-line react-doctor/rerender-state-only-in-handlers
    const [selection, setSelection] = useState<CropSelection>({
        x: 0,
        y: 0,
        width: 0,
        height: 0,
    });
    const isDraggingRef = useRef(false);
    const [dragType, setDragType] = useState<HandleType | null>(null);
    const dragStartRef = useRef({
        x: 0,
        y: 0,
        selection: { x: 0, y: 0, width: 0, height: 0 },
    });

    // Load image and initialize selection
    useEffect((): void => {
        const img = new Image();
        const url = URL.createObjectURL(imageFile);
        img.addEventListener('load', (): void => {
            setImage(img);
            URL.revokeObjectURL(url);
        });
        img.src = url;
    }, [imageFile]);

    // Handle initial sizing and resize
    const updateDisplaySize = useCallback((): void => {
        if (!image || !containerRef.current) return;

        const container = containerRef.current;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const imgWidth = image.width;
        const imgHeight = image.height;

        let dWidth = containerWidth;
        let dHeight = (imgHeight * containerWidth) / imgWidth;

        if (dHeight > containerHeight) {
            dHeight = containerHeight;
            dWidth = (imgWidth * containerHeight) / imgHeight;
        }

        setDisplaySize({ width: dWidth, height: dHeight });

        // Initialize selection to cover the whole image (or centered square/rect)
        let selWidth = dWidth;
        let selHeight = dHeight;

        if (aspectRatio) {
            if (selWidth / selHeight > aspectRatio) {
                selWidth = selHeight * aspectRatio;
            } else {
                selHeight = selWidth / aspectRatio;
            }
        }

        const initialSelection = {
            x: (dWidth - selWidth) / 2,
            y: (dHeight - selHeight) / 2,
            width: selWidth,
            height: selHeight,
        };
        setSelection(initialSelection);

        // Report initial selection in real image coordinates
        const scale = imgWidth / dWidth;
        onCropChange({
            x: Math.round(initialSelection.x * scale),
            y: Math.round(initialSelection.y * scale),
            width: Math.round(initialSelection.width * scale),
            height: Math.round(initialSelection.height * scale),
        });
    }, [image, aspectRatio, onCropChange]);

    useEffect((): (() => void) => {
        const handleResize = (): void => {
            requestAnimationFrame((): void => {
                updateDisplaySize();
            });
        };

        handleResize();
        window.addEventListener('resize', handleResize);
        return (): void => {
            window.removeEventListener('resize', handleResize);
        };
    }, [updateDisplaySize]);

    // Draw canvas
    useEffect((): void => {
        if (!canvasRef.current || !image || displaySize.width === 0) return;
        drawCropCanvas(canvasRef.current, image, displaySize, selection);
    }, [image, displaySize, selection]);

    const handleMouseDown = (e: React.MouseEvent): void => {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check which handle was hit
        const hs = 20; // larger hit area for handles
        const handles = getHandlePositions(selection);

        const hitHandle = handles.find(
            (h): boolean =>
                Math.abs(mouseX - h.x) < hs && Math.abs(mouseY - h.y) < hs,
        );

        if (hitHandle) {
            setDragType(hitHandle.t);
        } else if (
            mouseX >= selection.x &&
            mouseX <= selection.x + selection.width &&
            mouseY >= selection.y &&
            mouseY <= selection.y + selection.height
        ) {
            setDragType('move');
        } else {
            return;
        }

        isDraggingRef.current = true;
        dragStartRef.current = {
            x: mouseX,
            y: mouseY,
            selection: { ...selection },
        };
    };

    const handleMouseMove = (e: React.MouseEvent): void => {
        if (!isDraggingRef.current || !dragType || !image) return;

        const rect = canvasRef.current?.getBoundingClientRect();
        if (!rect) return;

        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        const dx = mouseX - dragStartRef.current.x;
        const dy = mouseY - dragStartRef.current.y;

        const nextSel = { ...dragStartRef.current.selection };

        if (dragType === 'move') {
            nextSel.x = Math.max(
                0,
                Math.min(displaySize.width - nextSel.width, nextSel.x + dx),
            );
            nextSel.y = Math.max(
                0,
                Math.min(displaySize.height - nextSel.height, nextSel.y + dy),
            );
        } else {
            const minSize = 20;

            if (dragType.includes('w')) {
                const newWidth = Math.max(minSize, nextSel.width - dx);
                const actualDx = nextSel.width - newWidth;
                const newX = nextSel.x + actualDx;
                if (newX >= 0) {
                    nextSel.width = newWidth;
                    nextSel.x = newX;
                }
            }
            if (dragType.includes('e')) {
                nextSel.width = Math.max(
                    minSize,
                    Math.min(displaySize.width - nextSel.x, nextSel.width + dx),
                );
            }
            if (dragType.includes('n')) {
                const newHeight = Math.max(minSize, nextSel.height - dy);
                const actualDy = nextSel.height - newHeight;
                const newY = nextSel.y + actualDy;
                if (newY >= 0) {
                    nextSel.height = newHeight;
                    nextSel.y = newY;
                }
            }
            if (dragType.includes('s')) {
                nextSel.height = Math.max(
                    minSize,
                    Math.min(
                        displaySize.height - nextSel.y,
                        nextSel.height + dy,
                    ),
                );
            }

            if (aspectRatio) {
                if (
                    dragType === 'e' ||
                    dragType === 'w' ||
                    dragType === 'n' ||
                    dragType === 's'
                ) {
                    if (dragType === 'e' || dragType === 'w') {
                        nextSel.height = nextSel.width / aspectRatio;
                    } else {
                        nextSel.width = nextSel.height * aspectRatio;
                    }
                } else {
                    nextSel.height = nextSel.width / aspectRatio;
                }

                if (nextSel.x + nextSel.width > displaySize.width) {
                    nextSel.width = displaySize.width - nextSel.x;
                    nextSel.height = nextSel.width / aspectRatio;
                }
                if (nextSel.y + nextSel.height > displaySize.height) {
                    nextSel.height = displaySize.height - nextSel.y;
                    nextSel.width = nextSel.height * aspectRatio;
                }
            }
        }

        setSelection(nextSel);

        // Update parent with real coordinates
        const scale = image.width / displaySize.width;
        onCropChange({
            x: Math.round(nextSel.x * scale),
            y: Math.round(nextSel.y * scale),
            width: Math.round(nextSel.width * scale),
            height: Math.round(nextSel.height * scale),
        });
    };

    const handleMouseUp = (): void => {
        isDraggingRef.current = false;
        setDragType(null);
    };

    return (
        <div
            className={cn(
                'relative flex items-center justify-center overflow-hidden rounded-lg bg-black/10',
                className,
            )}
            ref={containerRef}
            style={{ minHeight: '300px' }}
        >
            {image ? (
                <canvas
                    className={cn(
                        'cursor-crosshair',
                        dragType === 'move' && 'cursor-move',
                        dragType?.includes('nw') && 'cursor-nw-resize',
                        dragType?.includes('ne') && 'cursor-ne-resize',
                        dragType?.includes('sw') && 'cursor-sw-resize',
                        dragType?.includes('se') && 'cursor-se-resize',
                        dragType === 'n' && 'cursor-n-resize',
                        dragType === 's' && 'cursor-s-resize',
                        dragType === 'e' && 'cursor-e-resize',
                        dragType === 'w' && 'cursor-w-resize',
                    )}
                    ref={canvasRef}
                    style={{
                        width: displaySize.width,
                        height: displaySize.height,
                    }}
                    onMouseDown={handleMouseDown}
                    onMouseLeave={handleMouseUp}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                />
            ) : (
                <div className="text-muted-foreground">Loading image...</div>
            )}
        </div>
    );
};
