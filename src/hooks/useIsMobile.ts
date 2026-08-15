import { useEffect, useState } from 'react';

const MOBILE_QUERY = '(max-width: 768px)';

export const useIsMobile = (): boolean => {
    const [isMobile, setIsMobile] = useState<boolean>(
        () => globalThis.matchMedia(MOBILE_QUERY).matches,
    );

    useEffect((): (() => void) => {
        const mq = globalThis.matchMedia(MOBILE_QUERY);
        const onChange = (e: MediaQueryListEvent): void => {
            setIsMobile(e.matches);
        };
        mq.addEventListener('change', onChange);
        return (): void => {
            mq.removeEventListener('change', onChange);
        };
    }, []);

    return isMobile;
};
