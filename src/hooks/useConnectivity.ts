import { useEffect, useState } from 'react';

import { wsClient } from '@/ws/client';
import { WsEvents } from '@/ws/events';

interface ConnectivityState {
    isOnline: boolean;
    isWsConnected: boolean;
}

export function useConnectivity(): ConnectivityState {
    const [isOnline, setIsOnline] = useState(navigator.onLine);
    const [isWsConnected, setIsWsConnected] = useState(false);

    useEffect(() => {
        const handleOnline = (): void => setIsOnline(true);
        const handleOffline = (): void => setIsOnline(false);

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const unsubscribeAuth = wsClient.on(WsEvents.AUTHENTICATED, () => {
            setIsWsConnected(true);
        });

        const unsubscribeDisc = wsClient.on(WsEvents.DISCONNECTED, () => {
            setIsWsConnected(false);
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubscribeAuth();
            unsubscribeDisc();
        };
    }, []);

    return { isOnline, isWsConnected };
}
