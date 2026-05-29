import { useCallback, useEffect, useRef, useState } from 'react';

interface UseResizableOptions {
    initialWidth: number;
    minWidth: number;
    maxWidth: number;
    storageKey: string;
    side: 'left' | 'right';
}

interface UseResizableResult {
    width: number;
    isResizing: boolean;
    handleMouseDown: (e: React.MouseEvent) => void;
}

/**
 * Hook to handle resizing logic
 *
 * @param side 'left' - Component on left side of screen, resize by dragging right edge
 *             'right' - Component on right side of screen, resize by dragging left edge
 */
export const useResizable = ({
    initialWidth,
    minWidth,
    maxWidth,
    storageKey,
    side,
}: UseResizableOptions): UseResizableResult => {
    const [width, setWidth] = useState((): number => {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
            const parsed = parseInt(stored, 10);
            if (!isNaN(parsed) && parsed >= minWidth && parsed <= maxWidth) {
                return parsed;
            }
        }
        return initialWidth;
    });

    const [isResizing, setIsResizing] = useState(false);
    const startXRef = useRef(0);
    const startWidthRef = useRef(0);
    const currentWidthRef = useRef(width);
    const pendingWidthRef = useRef(width);
    const frameRef = useRef<number | null>(null);

    useEffect((): void => {
        currentWidthRef.current = width;
        pendingWidthRef.current = width;
    }, [width]);

    const handleMouseDown = useCallback(
        (e: React.MouseEvent): void => {
            e.preventDefault();
            setIsResizing(true);
            startXRef.current = e.clientX;
            startWidthRef.current = width;

            document.body.style.cursor = 'col-resize';
            document.body.style.userSelect = 'none';
        },
        [width],
    );

    const handleMouseMove = useCallback(
        (e: MouseEvent): void => {
            const delta = e.clientX - startXRef.current;
            let newWidth: number;

            if (side === 'left') {
                newWidth = startWidthRef.current + delta;
            } else {
                newWidth = startWidthRef.current - delta;
            }

            newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
            pendingWidthRef.current = newWidth;
            currentWidthRef.current = newWidth;

            if (frameRef.current !== null) return;
            frameRef.current = window.requestAnimationFrame((): void => {
                frameRef.current = null;
                setWidth(pendingWidthRef.current);
            });
        },
        [side, minWidth, maxWidth],
    );

    const handleMouseUp = useCallback((): void => {
        if (frameRef.current !== null) {
            window.cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
            setWidth(pendingWidthRef.current);
        }
        setIsResizing(false);
        localStorage.setItem(storageKey, currentWidthRef.current.toString());

        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, [storageKey]);

    useEffect((): (() => void) => {
        if (isResizing) {
            window.addEventListener('mousemove', handleMouseMove);
            window.addEventListener('mouseup', handleMouseUp);
        } else {
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        }

        return (): void => {
            if (frameRef.current !== null) {
                window.cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }
            window.removeEventListener('mousemove', handleMouseMove);
            window.removeEventListener('mouseup', handleMouseUp);
        };
    }, [isResizing, handleMouseMove, handleMouseUp]);

    return {
        width,
        isResizing,
        handleMouseDown,
    };
};
