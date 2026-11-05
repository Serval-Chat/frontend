import { act, renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import type { WsConnectionState } from '@/ws/client';

import { useConnectivity } from './useConnectivity';

const ws = vi.hoisted(() => {
    const listeners = new Set<() => void>();
    let state = 'connecting';
    return {
        listeners,
        getStatus: (): string => state,
        set: (next: string): void => {
            state = next;
            for (const listener of listeners) listener();
        },
    };
});

vi.mock('@/ws/client', () => ({
    wsClient: {
        getStatus: (): WsConnectionState => ws.getStatus() as WsConnectionState,
        onStatusChange: (listener: () => void): (() => void) => {
            ws.listeners.add(listener);
            return (): void => {
                ws.listeners.delete(listener);
            };
        },
    },
}));

describe('useConnectivity', (): void => {
    afterEach((): void => {
        vi.restoreAllMocks();
        ws.set('connecting');
    });

    it('follows websocket state changes', (): void => {
        const { result } = renderHook(useConnectivity);
        expect(result.current.status).toBe('connecting');

        act((): void => {
            ws.set('authenticated');
        });
        expect(result.current.status).toBe('online');

        act((): void => {
            ws.set('disconnected');
        });
        expect(result.current.status).toBe('reconnecting');
    });

    it('reports offline when the browser goes offline', (): void => {
        ws.set('authenticated');
        const { result } = renderHook(useConnectivity);
        expect(result.current.status).toBe('online');

        const onLine = vi.spyOn(navigator, 'onLine', 'get');
        onLine.mockReturnValue(false);
        act((): void => {
            globalThis.dispatchEvent(new Event('offline'));
        });
        expect(result.current.status).toBe('offline');

        onLine.mockReturnValue(true);
        act((): void => {
            globalThis.dispatchEvent(new Event('online'));
        });
        expect(result.current.status).toBe('online');
    });

    it('unsubscribes from the websocket client on unmount', (): void => {
        const { unmount } = renderHook(useConnectivity);
        expect(ws.listeners.size).toBe(1);
        unmount();
        expect(ws.listeners.size).toBe(0);
    });
});
