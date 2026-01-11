import React, { useEffect, useState } from 'react';

import { getAuthToken, hasAuthToken } from '@/utils/authToken';
import { setupGlobalWsHandlers, wsClient } from '@/ws';

interface WebSocketProviderProps {
    children: React.ReactNode;
}

/**
 * @description Provider for managing the WebSocket lifecycle.
 */
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
    children,
}) => {
    const [isAuthenticated, setIsAuthenticated] = useState(hasAuthToken());

    useEffect(() => {
        setupGlobalWsHandlers();
    }, []);

    useEffect(() => {
        // Listen for storage changes (login/logout)
        const handleStorageChange = () => {
            setIsAuthenticated(hasAuthToken());
        };

        window.addEventListener('storage', handleStorageChange);

        const handleAuthChange = () => {
            setIsAuthenticated(hasAuthToken());
        };

        window.addEventListener('auth-change', handleAuthChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('auth-change', handleAuthChange);
        };
    }, []);

    useEffect(() => {
        if (isAuthenticated) {
            const token = getAuthToken();
            wsClient.connect(token || undefined);
        } else {
            wsClient.disconnect();
        }

        return () => {
            wsClient.disconnect();
        };
    }, [isAuthenticated]);

    return <>{children}</>;
};
