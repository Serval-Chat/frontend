import React, {
    useCallback,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react';

import { cn } from '@/utils/cn';

const SCROLLBAR_SIZE = 16;
const MIN_THUMB_SIZE = 20;
const SCROLL_STEP = 32;

interface ScrollMetrics {
    clientHeight: number;
    clientWidth: number;
    scrollHeight: number;
    scrollLeft: number;
    scrollTop: number;
    scrollWidth: number;
}

interface NTScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
    viewportClassName?: string;
}

export const NTScrollArea = ({
    children,
    className,
    viewportClassName,
    ...props
}: NTScrollAreaProps) => {
    const viewportRef = useRef<HTMLDivElement>(null);
    const [metrics, setMetrics] = useState<ScrollMetrics>({
        clientHeight: 0,
        clientWidth: 0,
        scrollHeight: 0,
        scrollLeft: 0,
        scrollTop: 0,
        scrollWidth: 0,
    });

    const updateMetrics = useCallback((): void => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        setMetrics({
            clientHeight: viewport.clientHeight,
            clientWidth: viewport.clientWidth,
            scrollHeight: viewport.scrollHeight,
            scrollLeft: viewport.scrollLeft,
            scrollTop: viewport.scrollTop,
            scrollWidth: viewport.scrollWidth,
        });
    }, []);

    const updateMetricsRef = useRef(updateMetrics);
    useLayoutEffect(() => {
        updateMetricsRef.current = updateMetrics;
    });

    useLayoutEffect((): void => {
        updateMetricsRef.current();
    }, [children]);

    useEffect((): (() => void) | undefined => {
        const viewport = viewportRef.current;
        if (!viewport) return;

        const handler = (): void => {
            updateMetricsRef.current();
        };

        const resizeObserver = new ResizeObserver(handler);
        resizeObserver.observe(viewport);

        if (viewport.firstElementChild) {
            resizeObserver.observe(viewport.firstElementChild);
        }

        window.addEventListener('resize', handler);

        return (): void => {
            resizeObserver.disconnect();
            window.removeEventListener('resize', handler);
        };
    }, []);

    const hasVertical =
        metrics.scrollHeight > 0 &&
        metrics.scrollHeight > metrics.clientHeight + 1;
    const hasHorizontal =
        metrics.scrollWidth > 0 &&
        metrics.scrollWidth > metrics.clientWidth + 1;

    const scrollBy = useCallback((left: number, top: number): void => {
        viewportRef.current?.scrollBy({ left, top });
    }, []);

    const startDrag = useCallback(
        (axis: 'horizontal' | 'vertical', event: React.PointerEvent): void => {
            event.preventDefault();
            const viewport = viewportRef.current;
            if (!viewport) return;

            const startPointer =
                axis === 'vertical' ? event.clientY : event.clientX;
            const startScroll =
                axis === 'vertical' ? viewport.scrollTop : viewport.scrollLeft;
            const trackSize =
                axis === 'vertical'
                    ? metrics.clientHeight - SCROLLBAR_SIZE * 2
                    : metrics.clientWidth - SCROLLBAR_SIZE * 2;
            const viewportSize =
                axis === 'vertical'
                    ? metrics.clientHeight
                    : metrics.clientWidth;
            const scrollSize =
                axis === 'vertical'
                    ? metrics.scrollHeight
                    : metrics.scrollWidth;
            const thumbSize = Math.max(
                MIN_THUMB_SIZE,
                Math.round((viewportSize / scrollSize) * trackSize),
            );
            const scrollable = scrollSize - viewportSize;
            const draggable = Math.max(1, trackSize - thumbSize);

            const handlePointerMove = (moveEvent: PointerEvent): void => {
                const currentPointer =
                    axis === 'vertical' ? moveEvent.clientY : moveEvent.clientX;
                const delta = currentPointer - startPointer;
                const nextScroll =
                    startScroll + (delta / draggable) * scrollable;

                if (axis === 'vertical') {
                    viewport.scrollTop = nextScroll;
                } else {
                    viewport.scrollLeft = nextScroll;
                }
            };

            const handlePointerUp = (): void => {
                globalThis.removeEventListener(
                    'pointermove',
                    handlePointerMove,
                );
                globalThis.removeEventListener('pointerup', handlePointerUp);
            };

            globalThis.addEventListener('pointermove', handlePointerMove);
            globalThis.addEventListener('pointerup', handlePointerUp);
        },
        [metrics],
    );

    const verticalThumb = useMemo((): {
        size: number;
        start: number;
    } | null => {
        if (!hasVertical) return null;

        const trackSize = metrics.clientHeight - SCROLLBAR_SIZE * 2;
        const thumbSize = Math.max(
            MIN_THUMB_SIZE,
            Math.round(
                (metrics.clientHeight / metrics.scrollHeight) * trackSize,
            ),
        );
        const scrollable = metrics.scrollHeight - metrics.clientHeight;
        const travel = Math.max(0, trackSize - thumbSize);
        const top =
            SCROLLBAR_SIZE +
            (scrollable > 0 ? (metrics.scrollTop / scrollable) * travel : 0);

        return { size: thumbSize, start: top };
    }, [hasVertical, metrics]);

    const horizontalThumb = useMemo((): {
        size: number;
        start: number;
    } | null => {
        if (!hasHorizontal) return null;

        const trackSize = metrics.clientWidth - SCROLLBAR_SIZE * 2;
        const thumbSize = Math.max(
            MIN_THUMB_SIZE,
            Math.round((metrics.clientWidth / metrics.scrollWidth) * trackSize),
        );
        const scrollable = metrics.scrollWidth - metrics.clientWidth;
        const travel = Math.max(0, trackSize - thumbSize);
        const left =
            SCROLLBAR_SIZE +
            (scrollable > 0 ? (metrics.scrollLeft / scrollable) * travel : 0);

        return { size: thumbSize, start: left };
    }, [hasHorizontal, metrics]);

    return (
        <div
            className={cn('nt-scroll-area relative overflow-hidden', className)}
            {...props}
        >
            <div
                className={cn(
                    'nt-scroll-area__viewport absolute top-0 left-0 overflow-auto',
                    viewportClassName,
                )}
                ref={viewportRef}
                style={{
                    right: hasVertical ? SCROLLBAR_SIZE : 0,
                    bottom: hasHorizontal ? SCROLLBAR_SIZE : 0,
                }}
                onScroll={updateMetrics}
            >
                {children}
            </div>

            {hasVertical && verticalThumb ? (
                <div
                    aria-hidden="true"
                    className="nt-scroll-area__bar nt-scroll-area__bar--vertical"
                    style={{ bottom: hasHorizontal ? SCROLLBAR_SIZE : 0 }}
                >
                    <button
                        aria-label="Scroll up"
                        className="nt-scroll-area__button nt-scroll-area__button--up"
                        type="button"
                        onClick={(): void => {
                            scrollBy(0, -SCROLL_STEP);
                        }}
                    />
                    <div className="nt-scroll-area__track" />
                    <button
                        aria-label="Scroll down"
                        className="nt-scroll-area__button nt-scroll-area__button--down"
                        type="button"
                        onClick={(): void => {
                            scrollBy(0, SCROLL_STEP);
                        }}
                    />
                    <div
                        className="nt-scroll-area__thumb nt-scroll-area__thumb--vertical"
                        role="presentation"
                        style={{
                            height: verticalThumb.size,
                            top: verticalThumb.start,
                        }}
                        onPointerDown={(event): void => {
                            startDrag('vertical', event);
                        }}
                    />
                </div>
            ) : null}

            {hasHorizontal && horizontalThumb ? (
                <div
                    aria-hidden="true"
                    className="nt-scroll-area__bar nt-scroll-area__bar--horizontal"
                    style={{ right: hasVertical ? SCROLLBAR_SIZE : 0 }}
                >
                    <button
                        aria-label="Scroll left"
                        className="nt-scroll-area__button nt-scroll-area__button--left"
                        type="button"
                        onClick={(): void => {
                            scrollBy(-SCROLL_STEP, 0);
                        }}
                    />
                    <div className="nt-scroll-area__track" />
                    <button
                        aria-label="Scroll right"
                        className="nt-scroll-area__button nt-scroll-area__button--right"
                        type="button"
                        onClick={(): void => {
                            scrollBy(SCROLL_STEP, 0);
                        }}
                    />
                    <div
                        className="nt-scroll-area__thumb nt-scroll-area__thumb--horizontal"
                        role="presentation"
                        style={{
                            left: horizontalThumb.start,
                            width: horizontalThumb.size,
                        }}
                        onPointerDown={(event): void => {
                            startDrag('horizontal', event);
                        }}
                    />
                </div>
            ) : null}

            {hasVertical && hasHorizontal ? (
                <div aria-hidden="true" className="nt-scroll-area__corner" />
            ) : null}
        </div>
    );
};
