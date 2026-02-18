/* eslint-disable no-console */
import { v4 as uuidv4 } from 'uuid';

import {
    type IWsAuthenticatedEvent,
    type IWsEnvelope,
    WsEvents,
} from './events';

type EventHandler<T = unknown> = (
    payload: T,
    meta: IWsEnvelope['meta'],
) => void;

/**
 * @description WebSocket client
 */
class WsClient {
    private socket: WebSocket | null = null;
    private url: string;
    private handlers: Map<string, Set<EventHandler<unknown>>> = new Map();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelay = 1000;
    private pingInterval: number | null = null;
    private token: string | null = null;

    constructor() {
        const baseUrl =
            import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8001';
        this.url = baseUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
    }

    /**
     * Connect to the WebSocket server.
     */
    public connect(token?: string): void {
        if (token) this.token = token;
        if (this.socket?.readyState === WebSocket.OPEN) return;

        console.log('[WS] Connecting to:', this.url);
        this.socket = new WebSocket(this.url);

        this.socket.onopen = this.handleOpen.bind(this);
        this.socket.onmessage = this.handleMessage.bind(this);
        this.socket.onerror = this.handleError.bind(this);
        this.socket.onclose = this.handleClose.bind(this);
    }

    /**
     * Disconnect from the WebSocket server.
     */
    public disconnect(): void {
        this.stopPing();
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
    }

    /**
     * Send an event to the server.
     */
    public send(type: string, payload: unknown = {}, replyTo?: string): void {
        if (this.socket?.readyState !== WebSocket.OPEN) {
            console.warn('[WS] Cannot send message, socket not open');
            return;
        }

        const envelope: IWsEnvelope = {
            id: uuidv4(),
            event: { type, payload },
            meta: {
                ts: Date.now(),
                replyTo,
            },
        };

        this.socket.send(JSON.stringify(envelope));
    }

    /**
     * Subscribe to an event.
     */
    public on<T = unknown>(type: string, handler: EventHandler<T>): () => void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        this.handlers.get(type)!.add(handler as EventHandler<unknown>);

        return () => this.off(type, handler);
    }

    /**
     * Unsubscribe from an event.
     */
    public off<T = unknown>(type: string, handler: EventHandler<T>): void {
        const typeHandlers = this.handlers.get(type);
        if (typeHandlers) {
            typeHandlers.delete(handler as EventHandler<unknown>);
        }
    }

    private handleOpen(): void {
        console.log('[WS] Connection established');
        this.reconnectAttempts = 0;
        this.startPing();

        if (this.token) {
            this.authenticate(this.token);
        }
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const envelope: IWsEnvelope = JSON.parse(event.data);
            const { type, payload } = envelope.event;
            const { meta } = envelope;

            if (type === WsEvents.AUTHENTICATED) {
                console.log(
                    '[WS] Authenticated as:',
                    (payload as IWsAuthenticatedEvent).user.username,
                );
            }

            this.emit(type, payload, meta);
        } catch (error) {
            console.error('[WS] Failed to parse message:', error);
        }
    }

    private emit<T = unknown>(
        type: string,
        payload: T,
        meta: IWsEnvelope['meta'] = { ts: Date.now() },
    ): void {
        const typeHandlers = this.handlers.get(type);
        if (typeHandlers) {
            typeHandlers.forEach((handler) => handler(payload, meta));
        }
    }

    private handleError(error: Event): void {
        console.error('[WS] Error:', error);
    }

    private handleClose(event: CloseEvent): void {
        console.warn('Connection lost, reconnecting... for WS');
        console.log('[WS] Connection closed:', event.reason);
        this.stopPing();
        this.emit(WsEvents.DISCONNECTED, {
            code: event.code,
            reason: event.reason,
        });

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = Math.min(
                this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
                30000,
            );
            console.log(
                `[WS] Reconnecting in ${delay}ms... (Attempt ${this.reconnectAttempts + 1})`,
            );
            setTimeout(() => {
                this.reconnectAttempts++;
                this.connect();
            }, delay);
        }
    }

    private authenticate(token: string): void {
        console.log('[WS] Authenticating...');
        this.send(WsEvents.AUTHENTICATE, { token });
    }

    private startPing(): void {
        this.stopPing();
        this.pingInterval = window.setInterval(() => {
            this.send(WsEvents.PING);
        }, 30000);
    }

    private stopPing(): void {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
    }
}

export const wsClient = new WsClient();
