import { beforeEach, describe, expect, it, vi } from 'vitest';

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

describe('WsClient', () => {
    let mockWebSocket: MockWebSocket;

    beforeEach(() => {
        vi.clearAllMocks();

        // Use public API to reset state
        wsClient.disconnect();

        mockWebSocket = {
            send: vi.fn(),
            close: vi.fn(),
            readyState: 1, // OPEN
            onopen: null,
            onmessage: null,
            onerror: null,
            onclose: null,
        };

        class WebSocketMock {
            static CONNECTING = 0;
            static OPEN = 1;
            static CLOSING = 2;
            static CLOSED = 3;
            constructor() {
                return mockWebSocket as unknown as WebSocket;
            }
        }

        vi.stubGlobal('WebSocket', WebSocketMock);

        // Initialize the client
        wsClient.connect('test-token');
    });

    it('should subscribe to events', () => {
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

    it('should unsubscribe from events', () => {
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
});
