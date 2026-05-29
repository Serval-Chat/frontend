import type React from 'react';
import { useEffect } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import { useAuth } from '@/hooks/useAuth';
import { initTauriNotifications } from '@/lib/tauriNotifications';
import { useAppDispatch } from '@/store/hooks';
import { getAuthToken } from '@/utils/authToken';
import { setupGlobalWsHandlers, wsClient } from '@/ws';

interface WebSocketProviderProps {
    children: React.ReactNode;
}

/**
 * @description Provider for managing the WebSocket lifecycle.
 */
export const WebSocketProvider = ({
    children,
}: WebSocketProviderProps): React.ReactNode => {
    const { isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const dispatch = useAppDispatch();

    useEffect((): (() => void) => {
        if (isAuthenticated) {
            initTauriNotifications(queryClient).catch(console.error);
        }
        return setupGlobalWsHandlers(queryClient, dispatch);
    }, [queryClient, dispatch, isAuthenticated]);

    useEffect((): (() => void) => {
        if (isAuthenticated) {
            const token = getAuthToken();
            wsClient.connect(token || undefined);
        } else {
            wsClient.disconnect();
        }

        return (): void => {
            wsClient.disconnect();
        };
    }, [isAuthenticated]);

    return children;
};
