/* eslint-disable no-console */
import { v4 as uuidv4 } from 'uuid';

import { removeAuthToken } from '@/utils/authToken';

import { addWsDebugEvent } from './debug';
import { type IWsEnvelope, WsEvents } from './events';

type EventHandler<T = unknown> = (
    payload: T,
    meta: IWsEnvelope['meta'],
) => void;

interface IWsErrorPayload {
    code: string;
    details: { message: string; [key: string]: unknown };
}

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
    private messageQueue: string[] = [];
    private isAuthenticated = false;
    private state:
        | 'disconnected'
        | 'connecting'
        | 'connected'
        | 'authenticated' = 'disconnected';

    constructor() {
        const baseUrl =
            import.meta.env.VITE_WS_BASE_URL || 'ws://localhost:8001';
        this.url = baseUrl.replace(/^http/, 'ws').replace(/\/$/, '') + '/ws';
    }

    /**
     * Get the current state.
     */
    public getStatus():
        | 'disconnected'
        | 'connecting'
        | 'connected'
        | 'authenticated' {
        return this.state;
    }

    /**
     * Connect to the WebSocket server.
     */
    public connect(token?: string): void {
        this.token = token || null;
        if (this.socket?.readyState === WebSocket.OPEN) return;

        console.log('[WS] Connecting to:', this.url);
        this.state = 'connecting';
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
        this.isAuthenticated = false;
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
        this.state = 'disconnected';
        this.token = null;
    }

    /**
     * Send an event to the server.
     */
    public send(type: string, payload: unknown = {}, replyTo?: string): void {
        const envelope: IWsEnvelope = {
            id: uuidv4(),
            event: { type, payload },
            meta: {
                ts: Date.now(),
                replyTo,
            },
        };

        const message = JSON.stringify(envelope);

        if (
            this.socket?.readyState !== WebSocket.OPEN ||
            (this.token &&
                !this.isAuthenticated &&
                type !== WsEvents.AUTHENTICATE)
        ) {
            this.messageQueue.push(message);
            return;
        }

        addWsDebugEvent({
            direction: 'out',
            type: envelope.event.type,
            payload: envelope.event.payload,
            meta: envelope.meta,
        });
        this.socket.send(message);
    }

    /**
     * Subscribe to an event.
     */
    public on<T = unknown>(type: string, handler: EventHandler<T>): () => void {
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        const set = this.handlers.get(type)!;
        set.add(handler as EventHandler<unknown>);

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
        this.state = 'connected';
        this.reconnectAttempts = 0;
        this.startPing();

        if (this.token) {
            this.authenticate(this.token);
        } else {
            this.flushQueue();
        }
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const envelope: IWsEnvelope = JSON.parse(event.data);
            const { type, payload } = envelope.event;
            const { meta } = envelope;

            addWsDebugEvent({ direction: 'in', type, payload, meta });

            if (type === WsEvents.AUTHENTICATED) {
                this.isAuthenticated = true;
                this.state = 'authenticated';
                this.flushQueue();
            }

            if (type === 'error') {
                const errorPayload = payload as IWsErrorPayload;
                if (errorPayload.code === 'UNAUTHORIZED') {
                    console.error(
                        '[WS] Authentication failed, clearing token...',
                    );
                    void removeAuthToken();
                }
            }

            this.emit(type, payload, meta);
        } catch (error) {
            console.error('[WS] Failed to parse message:', error);
        }
    }

    private flushQueue(): void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            while (this.messageQueue.length > 0) {
                const msg = this.messageQueue.shift();
                if (msg) {
                    try {
                        const parsed = JSON.parse(msg) as IWsEnvelope;
                        addWsDebugEvent({
                            direction: 'out',
                            type: parsed.event.type,
                            payload: parsed.event.payload,
                            meta: parsed.meta,
                        });
                    } catch {
                        addWsDebugEvent({
                            direction: 'out',
                            type: 'unknown',
                            payload: msg,
                        });
                    }
                    this.socket.send(msg);
                }
            }
        }
    }

    private emit<T = unknown>(
        type: string,
        payload: T,
        meta: IWsEnvelope['meta'] = { ts: Date.now() },
    ): void {
        const typeHandlers = this.handlers.get(type);

        if (typeHandlers) {
            typeHandlers.forEach((handler) => {
                try {
                    handler(payload, meta);
                } catch (error) {
                    console.error(`[WS] Error in handler for ${type}:`, error);
                }
            });
        }
    }

    private handleError(error: Event): void {
        console.error('[WS] Error:', error);
    }

    private handleClose(event: CloseEvent): void {
        console.warn('Connection lost, reconnecting... for WS');
        console.log('[WS] Connection closed:', event.reason);
        this.stopPing();
        this.isAuthenticated = false;
        this.state = 'disconnected';
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
