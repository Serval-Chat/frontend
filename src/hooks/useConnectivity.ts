import { useEffect, useState } from 'react';

import { wsClient } from '@/ws/client';
import { WsEvents } from '@/ws/events';

interface ConnectivityState {
    status:
        | 'online'
        | 'offline'
        | 'connecting'
        | 'reconnecting'
        | 'authenticating';
}

export function useConnectivity(): ConnectivityState {
    const [status, setStatus] = useState<ConnectivityState['status']>(() => {
        if (!navigator.onLine) return 'offline';
        const wsStatus = wsClient.getStatus();
        if (wsStatus === 'authenticated') return 'online';
        if (wsStatus === 'connecting') return 'connecting';
        return 'connecting';
    });

    useEffect(() => {
        const handleOnline = (): void => setStatus('connecting');
        const handleOffline = (): void => setStatus('offline');

        window.addEventListener('online', handleOnline);
        window.addEventListener('offline', handleOffline);

        const unsubscribeAuth = wsClient.on(WsEvents.AUTHENTICATED, () => {
            setStatus('online');
        });

        const unsubscribeDisc = wsClient.on(WsEvents.DISCONNECTED, () => {
            setStatus((prev) =>
                prev === 'offline' ? 'offline' : 'reconnecting',
            );
        });

        return () => {
            window.removeEventListener('online', handleOnline);
            window.removeEventListener('offline', handleOffline);
            unsubscribeAuth();
            unsubscribeDisc();
        };
    }, []);

    return { status };
}
