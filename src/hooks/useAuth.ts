import { useEffect, useState } from 'react';

import { hasAuthToken } from '@/utils/authToken';

/**
 * @description Hook for managing and listening to authentication state.
 */
export const useAuth = (): { isAuthenticated: boolean } => {
    const [isAuthenticated, setIsAuthenticated] = useState((): boolean =>
        hasAuthToken(),
    );

    useEffect((): (() => void) => {
        const handleAuthChange = (): void => {
            setIsAuthenticated(hasAuthToken());
        };

        globalThis.addEventListener('auth-change', handleAuthChange);
        globalThis.addEventListener('storage', handleAuthChange);

        return (): void => {
            globalThis.removeEventListener('auth-change', handleAuthChange);
            globalThis.removeEventListener('storage', handleAuthChange);
        };
    }, []);

    return { isAuthenticated };
};
