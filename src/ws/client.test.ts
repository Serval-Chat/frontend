import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { wsClient } from './client';

interface MockWebSocket {
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    readyState: number;
    onopen: ((ev: Event) => void) | null;
    onmessage: ((ev: MessageEvent) => void) | null;
    onerror: ((ev: Event) => void) | null;
    onclose: ((ev: CloseEvent) => void) | null;
}

describe('WsClient', (): void => {
    let mockWebSocket: MockWebSocket;
    let sockets: MockWebSocket[];

    beforeEach((): void => {
        vi.clearAllMocks();
        vi.useFakeTimers();

        // Use public API to reset state
        wsClient.disconnect();

        sockets = [];

        const createMockWebSocket = (): MockWebSocket => {
            const mock = {
                send: vi.fn(),
                close: vi.fn(),
                readyState: 0, // CONNECTING
                onopen: null,
                onmessage: null,
                onerror: null,
                onclose: null,
                addEventListener: vi.fn((event: string, handler: any) => {
                    (mock as any)[`on${event}`] = handler;
                }),
                removeEventListener: vi.fn((event: string, handler: any) => {
                    if ((mock as any)[`on${event}`] === handler) {
                        (mock as any)[`on${event}`] = null;
                    }
                }),
            };
            return mock as unknown as MockWebSocket;
        };

        function WebSocketMock(): MockWebSocket {
            mockWebSocket = createMockWebSocket();
            sockets.push(mockWebSocket);
            return mockWebSocket;
        }

        Object.assign(WebSocketMock, {
            CONNECTING: 0,
            OPEN: 1,
            CLOSING: 2,
            CLOSED: 3,
        });

        vi.stubGlobal('WebSocket', WebSocketMock);

        // Initialize the client
        wsClient.connect('test-token');
    });

    afterEach((): void => {
        wsClient.disconnect();
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('should subscribe to events', (): void => {
        const handler = vi.fn();
        wsClient.on('test-event', handler);

        // Simulate message
        const envelope = {
            event: { type: 'test-event', payload: { data: 'hello' } },
            meta: { ts: Date.now() },
        };

        if (mockWebSocket.onmessage) {
            mockWebSocket.onmessage({
                data: JSON.stringify(envelope),
            } as MessageEvent);
        }

        expect(handler).toHaveBeenCalledWith({ data: 'hello' }, envelope.meta);
    });

    it('should unsubscribe from events', (): void => {
        const handler = vi.fn();
        const off = wsClient.on('test-event-2', handler);
        off();

        const envelope = {
            event: { type: 'test-event-2', payload: {} },
            meta: { ts: Date.now() },
        };

        if (mockWebSocket.onmessage) {
            mockWebSocket.onmessage({
                data: JSON.stringify(envelope),
            } as MessageEvent);
        }

        expect(handler).not.toHaveBeenCalled();
    });

    it('reconnects after an unexpected close', (): void => {
        expect(sockets).toHaveLength(1);

        mockWebSocket.onclose?.({
            code: 1006,
            reason: 'network lost',
        } as CloseEvent);

        expect(wsClient.getStatus()).toBe('disconnected');

        vi.advanceTimersByTime(1000);

        expect(sockets).toHaveLength(2);
    });

    it('does not reconnect after an intentional disconnect', (): void => {
        const firstSocket = mockWebSocket;

        wsClient.disconnect();
        firstSocket.onclose?.({ code: 1000, reason: 'logout' } as CloseEvent);

        vi.advanceTimersByTime(30_000);

        expect(sockets).toHaveLength(1);
    });

    it('ignores stale close events from sockets replaced during token changes', (): void => {
        const firstSocket = mockWebSocket;

        wsClient.connect('next-token');

        expect(sockets).toHaveLength(2);
        firstSocket.onclose?.({ code: 1000, reason: 'replaced' } as CloseEvent);

        vi.advanceTimersByTime(30_000);

        expect(sockets).toHaveLength(2);
    });

    it('cancels pending reconnects when a fresh connect is requested', (): void => {
        mockWebSocket.onclose?.({
            code: 1006,
            reason: 'network lost',
        } as CloseEvent);

        wsClient.connect('test-token');

        expect(sockets).toHaveLength(2);

        vi.advanceTimersByTime(1000);

        expect(sockets).toHaveLength(2);
    });

    const openAndAuthenticate = (): void => {
        mockWebSocket.readyState = 1; // OPEN
        mockWebSocket.onopen?.({} as Event);
        mockWebSocket.onmessage?.({
            data: JSON.stringify({
                event: { type: 'authenticated', payload: {} },
                meta: { ts: Date.now() },
            }),
        } as MessageEvent);
    };

    it('forces a reconnect when a ping goes unanswered (dead half-open socket)', (): void => {
        openAndAuthenticate();
        expect(sockets).toHaveLength(1);

        // The heartbeat interval fires and arms the pong timeout...
        vi.advanceTimersByTime(30_000);
        // ...but no pong (or any inbound traffic) arrives before it elapses.
        vi.advanceTimersByTime(10_000);

        expect(sockets).toHaveLength(2);
    });

    it('does not reconnect when traffic arrives before the heartbeat times out', (): void => {
        openAndAuthenticate();

        vi.advanceTimersByTime(30_000); // ping sent, pong timeout armed

        mockWebSocket.onmessage?.({
            data: JSON.stringify({
                event: { type: 'pong', payload: {} },
                meta: { ts: Date.now() },
            }),
        } as MessageEvent);

        vi.advanceTimersByTime(10_000); // the heartbeat window elapses harmlessly

        expect(sockets).toHaveLength(1);
    });

    it('reconnectIfNeeded reconnects immediately after the socket closed', (): void => {
        mockWebSocket.onclose?.({
            code: 1006,
            reason: 'network lost',
        } as CloseEvent);
        expect(wsClient.getStatus()).toBe('disconnected');

        // Network came back: reconnect now instead of waiting for backoff.
        wsClient.reconnectIfNeeded();

        expect(sockets).toHaveLength(2);
    });

    it('reconnectIfNeeded pings a healthy socket to verify liveness instead of reconnecting', (): void => {
        openAndAuthenticate();
        mockWebSocket.send.mockClear();

        wsClient.reconnectIfNeeded();

        expect(sockets).toHaveLength(1);
        expect(mockWebSocket.send).toHaveBeenCalled();
    });

    it('notifies status listeners as the connection transitions', (): void => {
        const states: string[] = [];
        const unsubscribe = wsClient.onStatusChange((state): void => {
            states.push(state);
        });

        openAndAuthenticate();

        expect(states).toEqual(['connected', 'authenticated']);

        mockWebSocket.onclose?.({
            code: 1006,
            reason: 'network lost',
        } as CloseEvent);

        expect(states).toContain('disconnected');

        unsubscribe();
    });
});
