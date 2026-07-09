import {
    useCallback,
    useEffect,
    useLayoutEffect,
    useRef,
    useState,
} from 'react';

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
            const parsed = Number.parseInt(stored, 10);
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

            newWidth =
                side === 'left'
                    ? startWidthRef.current + delta
                    : startWidthRef.current - delta;

            newWidth = Math.max(minWidth, Math.min(maxWidth, newWidth));
            pendingWidthRef.current = newWidth;
            currentWidthRef.current = newWidth;

            if (frameRef.current !== null) return;
            frameRef.current = globalThis.requestAnimationFrame((): void => {
                frameRef.current = null;
                setWidth(pendingWidthRef.current);
            });
        },
        [side, minWidth, maxWidth],
    );

    const handleMouseUp = useCallback((): void => {
        if (frameRef.current !== null) {
            globalThis.cancelAnimationFrame(frameRef.current);
            frameRef.current = null;
            setWidth(pendingWidthRef.current);
        }
        setIsResizing(false);
        localStorage.setItem(storageKey, currentWidthRef.current.toString());

        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    }, [storageKey]);

    const handleMouseMoveRef = useRef(handleMouseMove);
    const handleMouseUpRef = useRef(handleMouseUp);
    useLayoutEffect(() => {
        handleMouseMoveRef.current = handleMouseMove;
        handleMouseUpRef.current = handleMouseUp;
    });

    useEffect((): (() => void) => {
        const moveHandler = (e: MouseEvent): void => {
            handleMouseMoveRef.current(e);
        };
        const upHandler = (): void => {
            handleMouseUpRef.current();
        };

        if (isResizing) {
            globalThis.addEventListener('mousemove', moveHandler);
            globalThis.addEventListener('mouseup', upHandler);
        }

        return (): void => {
            if (frameRef.current !== null) {
                globalThis.cancelAnimationFrame(frameRef.current);
                frameRef.current = null;
            }
            globalThis.removeEventListener('mousemove', moveHandler);
            globalThis.removeEventListener('mouseup', upHandler);
        };
    }, [isResizing]);

    return {
        width,
        isResizing,
        handleMouseDown,
    };
};
