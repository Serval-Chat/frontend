import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { animate } from 'framer-motion';

export const useAutoHighlight = (sectionIds: string[]) => {
    const location = useLocation();
    const lastHighlightedHash = useRef<string | null>(null);

    useEffect(() => {
        const hash = location.hash.substring(1);

        // Only highlight if this is a new hash
        if (
            !hash ||
            !sectionIds.includes(hash) ||
            lastHighlightedHash.current === hash
        )
            return;

        lastHighlightedHash.current = hash;

        const element = document.getElementById(hash);
        if (!element) return;

        // highlight ring
        element.style.transition = 'box-shadow 0.3s, outline 0.3s';
        element.style.outline = '4px solid rgba(59, 130, 246, 0.6)';
        element.style.outlineOffset = '2px';
        element.style.boxShadow = '0 10px 15px -3px rgba(59, 130, 246, 0.2)';
        element.style.borderRadius = '0.5rem';

        //background pulse animation
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
            element.style.outline = '';
            element.style.outlineOffset = '';
            element.style.boxShadow = '';
        }, 1500);

        return () => clearTimeout(timeout);
    }, [location.hash, sectionIds]);
};
