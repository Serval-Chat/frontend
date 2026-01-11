import { useLayoutEffect, useState } from 'react';

interface Position {
    x: number;
    y: number;
}

interface UseSmartPositionOptions {
    isOpen: boolean;
    elementRef: React.RefObject<HTMLElement | null>;
    position?: Position;
    triggerRef?: React.RefObject<HTMLElement | null>;
    padding?: number;
    offset?: number;
}

export const useSmartPosition = ({
    isOpen,
    elementRef,
    position,
    triggerRef,
    padding = 16,
    offset = 10,
}: UseSmartPositionOptions) => {
    const [coords, setCoords] = useState<Position>(position || { x: 0, y: 0 });

    useLayoutEffect(() => {
        if (isOpen && elementRef.current) {
            const elementRect = elementRef.current.getBoundingClientRect();
            const { innerWidth, innerHeight } = window;

            let x = 0;
            let y = 0;

            if (position) {
                x = position.x;
                y = position.y;
            } else if (triggerRef?.current) {
                const triggerRect = triggerRef.current.getBoundingClientRect();
                x = triggerRect.right + offset;
                y = triggerRect.top;

                // Flip if overflow right
                if (x + elementRect.width > innerWidth) {
                    x = triggerRect.left - elementRect.width - offset;
                }
            } else {
                // Center fallback
                x = innerWidth / 2 - elementRect.width / 2;
                y = innerHeight / 2 - elementRect.height / 2;
            }

            // Boundary checks
            // Right edge
            if (x + elementRect.width > innerWidth) {
                x = innerWidth - elementRect.width - padding;
            }
            // Bottom edge
            if (y + elementRect.height > innerHeight) {
                y = innerHeight - elementRect.height - padding;
            }
            // Left edge
            if (x < padding) x = padding;
            // Top edge
            if (y < padding) y = padding;

            setCoords((prev) => {
                if (prev.x === x && prev.y === y) return prev;
                return { x, y };
            });
        }
    }, [isOpen, position, triggerRef, elementRef, padding, offset]);

    return coords;
};
