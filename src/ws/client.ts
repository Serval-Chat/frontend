/* eslint-disable no-console */
import { v4 as uuidv4 } from 'uuid';

import { addWsDebugEvent } from './debug';
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
    private messageQueue: string[] = [];
    private isAuthenticated = false;

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
        this.isAuthenticated = false;
        if (this.socket) {
            this.socket.close();
            this.socket = null;
        }
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
            console.debug(
                `[WsClient] QUEUING message of type: ${type}. Socket state: ${this.socket?.readyState}, Authenticated: ${this.isAuthenticated}`,
            );
            this.messageQueue.push(message);
            return;
        }

        console.debug(`[WsClient] SENDING message of type: ${type}`);
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
        console.debug(`[WsClient] SUBSCRIBING to event: ${type}`);
        if (!this.handlers.has(type)) {
            this.handlers.set(type, new Set());
        }
        const set = this.handlers.get(type)!;
        set.add(handler as EventHandler<unknown>);
        console.debug(`[WsClient] Total handlers for ${type}: ${set.size}`);

        return () => this.off(type, handler);
    }

    /**
     * Unsubscribe from an event.
     */
    public off<T = unknown>(type: string, handler: EventHandler<T>): void {
        console.debug(`[WsClient] UNSUBSCRIBING from event: ${type}`);
        const typeHandlers = this.handlers.get(type);
        if (typeHandlers) {
            const deleted = typeHandlers.delete(
                handler as EventHandler<unknown>,
            );
            console.debug(
                `[WsClient] Unsubscribe for ${type}: ${deleted ? 'SUCCESS' : 'FAILED (handler not found)'}. Remaining: ${typeHandlers.size}`,
            );
        }
    }

    private handleOpen(): void {
        console.log('[WS] Connection established');
        this.reconnectAttempts = 0;
        this.startPing();

        if (this.token) {
            console.debug('[WsClient] Token found, initiating authentication');
            this.authenticate(this.token);
        } else {
            console.debug(
                '[WsClient] No token found, flushing queue for guest',
            );
            this.flushQueue();
        }
    }

    private handleMessage(event: MessageEvent): void {
        try {
            const envelope: IWsEnvelope = JSON.parse(event.data);
            const { type, payload } = envelope.event;
            const { meta } = envelope;

            addWsDebugEvent({ direction: 'in', type, payload, meta });

            console.debug(
                `[WsClient] RECEIVED message of type: ${type}`,
                payload,
            );

            if (type === WsEvents.AUTHENTICATED) {
                console.log(
                    '[WS] Authenticated as:',
                    (payload as IWsAuthenticatedEvent).user.username,
                );
                this.isAuthenticated = true;
                this.flushQueue();
            }

            this.emit(type, payload, meta);
        } catch (error) {
            console.error('[WS] Failed to parse message:', error);
        }
    }

    private flushQueue(): void {
        if (this.socket?.readyState === WebSocket.OPEN) {
            console.log(
                `[WS] Flushing ${this.messageQueue.length} queued messages`,
            );
            while (this.messageQueue.length > 0) {
                const msg = this.messageQueue.shift();
                if (msg) {
                    try {
                        const parsed = JSON.parse(msg) as IWsEnvelope;
                        console.debug(
                            `[WsClient] Flushing message of type: ${parsed.event.type}`,
                        );
                        addWsDebugEvent({
                            direction: 'out',
                            type: parsed.event.type,
                            payload: parsed.event.payload,
                            meta: parsed.meta,
                        });
                    } catch {
                        console.debug('[WsClient] Flushing raw message');
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
        console.debug(
            `[WsClient] EMITTING ${type}. Registered handlers: ${typeHandlers?.size || 0}`,
        );

        if (typeHandlers) {
            typeHandlers.forEach((handler) => {
                try {
                    console.debug(`[WsClient] Executing handler for ${type}`);
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
