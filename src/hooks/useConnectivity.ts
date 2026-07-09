import { useEffect, useState } from 'react';

import { type WsConnectionState, wsClient } from '@/ws/client';

interface ConnectivityState {
    status:
        | 'online'
        | 'offline'
        | 'connecting'
        | 'reconnecting'
        | 'authenticating';
}

const isBrowserOnline = (): boolean =>
    typeof navigator === 'undefined' ? true : navigator.onLine;

/**
 * Map the raw WebSocket state plus the browser's network status onto the status
 * the UI cares about. Driving this from the client's real state (rather than
 * inferring from one-off events) keeps the reconnect banner in sync: it shows
 * whenever the socket is not authenticated and hides the moment it is.
 */
const deriveStatus = (
    wsState: WsConnectionState,
    online: boolean,
): ConnectivityState['status'] => {
    if (!online) return 'offline';
    switch (wsState) {
        case 'authenticated': {
            return 'online';
        }
        case 'connected': {
            return 'authenticating';
        }
        case 'connecting': {
            return 'connecting';
        }
        case 'disconnected': {
            return 'reconnecting';
        }
    }
};

export function useConnectivity(): ConnectivityState {
    const [status, setStatus] = useState<ConnectivityState['status']>(
        (): ConnectivityState['status'] =>
            deriveStatus(wsClient.getStatus(), isBrowserOnline()),
    );

    useEffect((): (() => void) => {
        const update = (): void => {
            setStatus(deriveStatus(wsClient.getStatus(), isBrowserOnline()));
        };

        const unsubscribe = wsClient.onStatusChange(update);
        globalThis.addEventListener('online', update);
        globalThis.addEventListener('offline', update);

        // Re-sync once in case the state changed between render and effect setup.
        update();

        return (): void => {
            unsubscribe();
            globalThis.removeEventListener('online', update);
            globalThis.removeEventListener('offline', update);
        };
    }, []);

    return { status };
}
