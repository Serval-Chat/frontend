import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { animate } from 'framer-motion';

export const useAutoHighlight = (sectionIds: string[]) => {
    const location = useLocation();
    const lastHighlightedHash = useRef<string | null>(null);

    useEffect(() => {
        const hash = location.hash.substring(1);

        // only highlight if this is a new hash
        if (
            !hash ||
            !sectionIds.includes(hash) ||
            lastHighlightedHash.current === hash
        )
            return;

        lastHighlightedHash.current = hash;

        const element = document.getElementById(hash);
        if (!element) return;

        const highlightClasses = [
            'transition-[box-shadow,outline]',
            'duration-300',
            'outline-4',
            'outline-primary/60',
            'outline-offset-2',
            'shadow-lg',
            'shadow-primary/20',
            'rounded-md',
        ];

        // apply highlight
        element.classList.add(...highlightClasses);

        // background pulse animation
        animate(
            element,
            {
                backgroundColor: [
                    'rgba(59, 130, 246, 0)',
                    'rgba(59, 130, 246, 0.3)',
                    'rgba(59, 130, 246, 0)',
                ],
            },
            { duration: 1.5, times: [0, 0.2, 1] }
        );

        // remove highlight after animation
        const timeout = setTimeout(() => {
            element.classList.remove(...highlightClasses);
        }, 1500);

        return () => {
            clearTimeout(timeout);
            element.classList.remove(...highlightClasses);
        };
    }, [location.hash, sectionIds]);
};
