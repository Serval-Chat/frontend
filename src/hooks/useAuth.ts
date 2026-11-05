import { useSyncExternalStore } from 'react';

import { hasAuthToken } from '@/utils/authToken';

const subscribe = (onChange: () => void): (() => void) => {
    globalThis.addEventListener('auth-change', onChange);
    globalThis.addEventListener('storage', onChange);

    return (): void => {
        globalThis.removeEventListener('auth-change', onChange);
        globalThis.removeEventListener('storage', onChange);
    };
};

/**
 * @description Hook for managing and listening to authentication state.
 */
export const useAuth = (): { isAuthenticated: boolean } => {
    const isAuthenticated = useSyncExternalStore(subscribe, hasAuthToken);

    return { isAuthenticated };
};
