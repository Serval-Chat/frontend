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

        const createMockWebSocket = (): MockWebSocket => ({
            send: vi.fn(),
            close: vi.fn(),
            readyState: 0, // CONNECTING
            onopen: null,
            onmessage: null,
            onerror: null,
            onclose: null,
        });

        class WebSocketMock {
            static CONNECTING = 0;
            static OPEN = 1;
            static CLOSING = 2;
            static CLOSED = 3;
            constructor() {
                mockWebSocket = createMockWebSocket();
                sockets.push(mockWebSocket);
                return mockWebSocket as any as WebSocket;
            }
        }

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

        vi.advanceTimersByTime(30000);

        expect(sockets).toHaveLength(1);
    });

    it('ignores stale close events from sockets replaced during token changes', (): void => {
        const firstSocket = mockWebSocket;

        wsClient.connect('next-token');

        expect(sockets).toHaveLength(2);
        firstSocket.onclose?.({ code: 1000, reason: 'replaced' } as CloseEvent);

        vi.advanceTimersByTime(30000);

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
});
