import { useCallback, useLayoutEffect, useRef } from 'react';

export interface UseSwipeGestureOptions {
    /** Called when user swipes from right to left (left swipe) */
    onSwipeLeft?: () => void;
    /** Called when user swipes from left to right (right swipe) */
    onSwipeRight?: () => void;
    /** Minimum horizontal distance in px to register as a swipe. Default: 60 */
    threshold?: number;
    /**
     * Maximum vertical drift in px before the gesture is treated as a scroll
     * and cancelled. Default: 80
     */
    maxVerticalDrift?: number;
    /** Set to false to disable the gesture listener entirely. Default: true */
    enabled?: boolean;
    onDragStart?: () => void;
    /**
     * Called every touchmove with the current horizontal delta in px.
     * Fires even before the threshold is met - use this to drive live animations.
     * Will NOT fire if the gesture was cancelled by vertical drift.
     */
    onDragMove?: (deltaX: number) => void;
    /**
     * Called on touchend with the final horizontal delta, before onSwipeLeft /
     * onSwipeRight decision. Use this to commit or revert the drag animation.
     */
    onDragEnd?: (deltaX: number) => void;
}

export interface UseSwipeGestureResult {
    /**
     * Attach this callback ref to the element that should capture swipe
     * gestures. Using a callback ref ensures listeners are registered
     * immediately when the element mounts.
     */
    ref: (el: HTMLElement | null) => void;
}

/**
 * Detects horizontal swipe gestures on mobile via Touch Events.
 * Automatically ignores gestures that drift too far vertically so that
 * normal scrolling within the element still works.
 *
 * Uses a callback ref so touch listeners are registered/removed synchronously
 * as the element mounts and unmounts.
 */
export const useSwipeGesture = ({
    onSwipeLeft,
    onSwipeRight,
    threshold = 60,
    maxVerticalDrift = 80,
    enabled = true,
    onDragStart,
    onDragMove,
    onDragEnd,
}: UseSwipeGestureOptions): UseSwipeGestureResult => {
    // Keep latest option values in refs so the callback ref only needs to be
    // created once (stable identity) while still using up-to-date values.
    const onSwipeLeftRef = useRef(onSwipeLeft);
    const onSwipeRightRef = useRef(onSwipeRight);
    const thresholdRef = useRef(threshold);
    const maxVerticalDriftRef = useRef(maxVerticalDrift);
    const enabledRef = useRef(enabled);
    const onDragStartRef = useRef(onDragStart);
    const onDragMoveRef = useRef(onDragMove);
    const onDragEndRef = useRef(onDragEnd);

    useLayoutEffect(() => {
        onSwipeLeftRef.current = onSwipeLeft;
        onSwipeRightRef.current = onSwipeRight;
        thresholdRef.current = threshold;
        maxVerticalDriftRef.current = maxVerticalDrift;
        enabledRef.current = enabled;
        onDragStartRef.current = onDragStart;
        onDragMoveRef.current = onDragMove;
        onDragEndRef.current = onDragEnd;
    });

    // Per-gesture state stored in refs (not React state - no re-render needed)
    const startXRef = useRef<number>(0);
    const startYRef = useRef<number>(0);
    const cancelledRef = useRef<boolean>(false);

    const handleTouchStart = useCallback((e: TouchEvent) => {
        const touch = e.touches[0];
        if (!touch) return;
        startXRef.current = touch.clientX;
        startYRef.current = touch.clientY;
        cancelledRef.current = false;
        onDragStartRef.current?.();
    }, []);

    const handleTouchMove = useCallback((e: TouchEvent) => {
        if (cancelledRef.current) return;
        const touch = e.touches[0];
        if (!touch) return;

        const deltaY = Math.abs(touch.clientY - startYRef.current);
        if (deltaY > maxVerticalDriftRef.current) {
            cancelledRef.current = true;
            onDragEndRef.current?.(0);
            return;
        }

        const deltaX = touch.clientX - startXRef.current;
        onDragMoveRef.current?.(deltaX);
    }, []);

    const handleTouchEnd = useCallback((e: TouchEvent) => {
        if (cancelledRef.current) return;

        const touch = e.changedTouches[0];
        if (!touch) return;

        const deltaX = touch.clientX - startXRef.current;
        const deltaY = Math.abs(touch.clientY - startYRef.current);

        if (deltaY > maxVerticalDriftRef.current) {
            onDragEndRef.current?.(0);
            return;
        }

        onDragEndRef.current?.(deltaX);

        if (deltaX > thresholdRef.current) {
            onSwipeRightRef.current?.();
        } else if (deltaX < -thresholdRef.current) {
            onSwipeLeftRef.current?.();
        }
    }, []);

    /**
     * Callback ref: called with the element when it mounts (el !== null) and
     * with null when it unmounts. We register/remove listeners here so we
     * never miss the mount.
     */
    const ref = useCallback(
        (el: HTMLElement | null) => {
            if (!el || !enabledRef.current) return;

            el.addEventListener('touchstart', handleTouchStart, {
                passive: true,
            });
            el.addEventListener('touchmove', handleTouchMove, {
                passive: true,
            });
            el.addEventListener('touchend', handleTouchEnd, { passive: true });

            return () => {
                el.removeEventListener('touchstart', handleTouchStart);
                el.removeEventListener('touchmove', handleTouchMove);
                el.removeEventListener('touchend', handleTouchEnd);
            };
        },
        [handleTouchStart, handleTouchMove, handleTouchEnd],
    );

    return { ref };
};
