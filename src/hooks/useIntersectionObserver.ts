import { type RefObject, useEffect, useState } from 'react';

interface UseIntersectionObserverProps {
    threshold?: number;
    rootMargin?: string;
    enabled?: boolean;
}

/**
 * @description Detects when an element is in the viewport.
 */
export const useIntersectionObserver = (
    elementRef: RefObject<Element | null>,
    {
        threshold = 0,
        rootMargin = '0px',
        enabled = true,
    }: UseIntersectionObserverProps = {},
): IntersectionObserverEntry | undefined => {
    const [entry, setEntry] = useState<IntersectionObserverEntry>();

    useEffect(() => {
        const node = elementRef?.current;
        if (!enabled || !node || typeof IntersectionObserver !== 'function')
            return;

        const observer = new IntersectionObserver(
            ([newEntry]) => {
                setEntry(newEntry);
            },
            { threshold, rootMargin },
        );

        observer.observe(node);

        return () => observer.disconnect();
    }, [elementRef, threshold, rootMargin, enabled]);

    return entry;
};
