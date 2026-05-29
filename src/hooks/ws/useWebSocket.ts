import { useEffect, useLayoutEffect, useRef } from 'react';

import { wsClient } from '@/ws/client';

/**
 * @description Hook for subscribing to WebSocket events.
 *
 * @param event - The event type to subscribe to.
 * @param callback - The function to call when the event is received.
 */
export function useWebSocket<T = unknown>(
    event: string,
    callback: (payload: T) => void,
): void {
    const callbackRef = useRef(callback);

    useLayoutEffect((): void => {
        callbackRef.current = callback;
    }, [callback]);

    useEffect((): (() => void) => {
        const unsubscribe = wsClient.on<T>(event, (payload): void => {
            callbackRef.current(payload);
        });
        return (): void => {
            unsubscribe();
        };
    }, [event]);
}
