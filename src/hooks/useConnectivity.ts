import { useSyncExternalStore } from 'react';

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

const subscribe = (onChange: () => void): (() => void) => {
    const unsubscribe = wsClient.onStatusChange(onChange);
    globalThis.addEventListener('online', onChange);
    globalThis.addEventListener('offline', onChange);

    return (): void => {
        unsubscribe();
        globalThis.removeEventListener('online', onChange);
        globalThis.removeEventListener('offline', onChange);
    };
};

const getSnapshot = (): ConnectivityState['status'] =>
    deriveStatus(wsClient.getStatus(), isBrowserOnline());

export function useConnectivity(): ConnectivityState {
    const status = useSyncExternalStore(subscribe, getSnapshot);

    return { status };
}
