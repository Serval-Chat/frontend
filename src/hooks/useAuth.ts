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

        window.addEventListener('auth-change', handleAuthChange);
        window.addEventListener('storage', handleAuthChange);

        return (): void => {
            window.removeEventListener('auth-change', handleAuthChange);
            window.removeEventListener('storage', handleAuthChange);
        };
    }, []);

    return { isAuthenticated };
};
