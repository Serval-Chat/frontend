/* eslint-disable no-console */
import { v4 as uuidv4 } from 'uuid';

import type { JsonValue } from '@/types/json';
import { removeAuthToken } from '@/utils/authToken';

import { addWsDebugEvent } from './debug';
import { type IWsEnvelope, WsEvents } from './events';

type EventHandler<T = unknown> = (
    payload: T,
    meta: IWsEnvelope['meta'],
) => void;

export type WsConnectionState =
    | 'disconnected'
    | 'connecting'
    | 'connected'
    | 'authenticated';

type StatusListener = (state: WsConnectionState) => void;

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
    private handlers = new Map<string, Set<EventHandler>>();
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 10;
    private reconnectDelay = 1000;
    private pingInterval: ReturnType<typeof setInterval> | null = null;
    private pongTimeout: ReturnType<typeof setTimeout> | null = null;
    private heartbeatTimeoutMs = 10_000;
    private reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    private token: string | null = null;
    private messageQueue: string[] = [];
    private maxQueuedMessages = 100;
    private isAuthenticated = false;
    private connectionId = 0;
    private state: WsConnectionState = 'disconnected';
    private statusListeners = new Set<StatusListener>();
    private socketListeners: {
        open: () => void;
        message: (event: MessageEvent) => void;
        error: (event: Event) => void;
        close: (event: CloseEvent) => void;
    } | null = null;

    constructor() {
        let baseUrl = import.meta.env.VITE_WS_BASE_URL as string | undefined;

        if (!baseUrl) {
            baseUrl = globalThis.location.origin.replace(/^http/, 'ws');
        }

        baseUrl ??= 'ws://localhost:8001';

        this.url = baseUrl.replace(/\/$/, '') + '/ws';
    }

    /**
     * Get the current state.
     */
    public getStatus(): WsConnectionState {
        return this.state;
    }

    /**
     * Subscribe to connection-state transitions. The listener fires on every
     * change (connecting → connected → authenticated, and back to disconnected),
     * so the UI can reflect the real socket state instead of inferring it.
     */
    public onStatusChange(listener: StatusListener): () => void {
        this.statusListeners.add(listener);
        return (): void => {
            this.statusListeners.delete(listener);
        };
    }

    private setState(next: WsConnectionState): void {
        if (this.state === next) return;
        this.state = next;
        for (const listener of this.statusListeners) {
            try {
                listener(next);
            } catch (error) {
                console.error('[WS] Error in status listener:', error);
            }
        }
    }

    /**
     * Connect to the WebSocket server.
     */
    public connect(token?: string): void {
        this.clearReconnectTimeout();
        const nextToken = token ?? null;
        if (
            this.socket &&
            (this.socket.readyState === WebSocket.OPEN ||
                this.socket.readyState === WebSocket.CONNECTING)
        ) {
            if (this.token === nextToken) return;
            this.closeSocket();
            this.stopPing();
            this.isAuthenticated = false;
        }
        this.token = nextToken;
        if (this.socket?.readyState === WebSocket.OPEN) return;

        console.log('[WS] Connecting to:', this.url);
        this.setState('connecting');
        const connectionId = ++this.connectionId;
        const socket = new WebSocket(this.url);
        this.socket = socket;

        const listeners = {
            open: (): void => {
                this.handleOpen(socket, connectionId);
            },
            message: (event: MessageEvent): void => {
                this.handleMessage(event, socket, connectionId);
            },
            error: (event: Event): void => {
                this.handleError(event, socket, connectionId);
            },
            close: (event: CloseEvent): void => {
                this.handleClose(event, socket, connectionId);
            },
        };
        this.socketListeners = listeners;

        socket.addEventListener('open', listeners.open);
        socket.addEventListener('message', listeners.message);
        socket.addEventListener('error', listeners.error);
        socket.addEventListener('close', listeners.close);
    }

    /**
     * Disconnect from the WebSocket server.
     */
    public disconnect(): void {
        this.connectionId++;
        this.clearReconnectTimeout();
        this.stopPing();
        this.isAuthenticated = false;
        this.reconnectAttempts = 0;
        this.closeSocket();
        this.setState('disconnected');
        this.token = null;
    }

    /**
     * Send an event to the server.
     */
    public send(type: string, payload: unknown = {}, replyTo?: string): void {
        const envelope: IWsEnvelope = {
            id: uuidv4(),
            event: { type, payload: payload as JsonValue },
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
            if (this.messageQueue.length >= this.maxQueuedMessages) {
                this.messageQueue.shift();
            }
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
     * Inject a fake inbound event directly into the handler pipeline.
     */
    public simulateEvent(type: string, payload: unknown): void {
        this.emit(type, payload);
    }

    /**
     * Subscribe to an event.
     */
    public on<T = unknown>(type: string, handler: EventHandler<T>): () => void {
        let set = this.handlers.get(type);
        if (!set) {
            set = new Set();
            this.handlers.set(type, set);
        }
        set.add(handler as EventHandler);

        return (): void => {
            this.off(type, handler);
        };
    }

    /**
     * Unsubscribe from an event.
     */
    public off<T = unknown>(type: string, handler: EventHandler<T>): void {
        const typeHandlers = this.handlers.get(type);
        if (typeHandlers) {
            typeHandlers.delete(handler as EventHandler);
            if (typeHandlers.size === 0) {
                this.handlers.delete(type);
            }
        }
    }

    private handleOpen(socket: WebSocket, connectionId: number): void {
        if (!this.isCurrentSocket(socket, connectionId)) return;

        console.log('[WS] Connection established');
        this.setState('connected');
        this.reconnectAttempts = 0;
        this.startPing();

        if (this.token) {
            this.authenticate(this.token);
        } else {
            this.flushQueue();
        }
    }

    private handleMessage(
        event: MessageEvent,
        socket: WebSocket,
        connectionId: number,
    ): void {
        if (!this.isCurrentSocket(socket, connectionId)) return;

        // Any inbound traffic proves the connection is still alive, so cancel
        // the pending heartbeat timeout (this covers pongs and every other event).
        this.clearPongTimeout();

        try {
            const envelope = JSON.parse(event.data as string) as IWsEnvelope;
            const { type, payload } = envelope.event;
            const { meta } = envelope;

            addWsDebugEvent({ direction: 'in', type, payload, meta });

            if (type === WsEvents.AUTHENTICATED) {
                this.isAuthenticated = true;
                this.setState('authenticated');
                this.flushQueue();
            }

            if (type === 'error') {
                const errorPayload = payload as unknown as IWsErrorPayload;
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

    private emit(
        type: string,
        payload: unknown,
        meta?: IWsEnvelope['meta'],
    ): void {
        const resolvedMeta = meta ?? { ts: Date.now() };
        const typeHandlers = this.handlers.get(type);

        if (typeHandlers) {
            for (const handler of typeHandlers) {
                try {
                    handler(payload, resolvedMeta);
                } catch (error) {
                    console.error(`[WS] Error in handler for ${type}:`, error);
                }
            }
        }
    }

    private handleError(
        error: Event,
        socket: WebSocket,
        connectionId: number,
    ): void {
        if (!this.isCurrentSocket(socket, connectionId)) return;

        console.error('[WS] Error:', error);
    }

    private handleClose(
        event: CloseEvent,
        socket: WebSocket,
        connectionId: number,
    ): void {
        if (!this.isCurrentSocket(socket, connectionId)) {
            console.log('[WS] Ignoring stale socket close');
            return;
        }

        console.warn('Connection lost, reconnecting... for WS');
        console.log('[WS] Connection closed:', event.reason);
        this.stopPing();
        this.isAuthenticated = false;
        this.setState('disconnected');
        this.socket = null;
        this.emit(WsEvents.DISCONNECTED, {
            code: event.code,
            reason: event.reason,
        });

        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = Math.min(
                this.reconnectDelay * Math.pow(2, this.reconnectAttempts),
                30_000,
            );
            console.log(
                `[WS] Reconnecting in ${String(delay)}ms... (Attempt ${String(this.reconnectAttempts + 1)})`,
            );
            this.reconnectTimeout = globalThis.setTimeout((): void => {
                this.reconnectTimeout = null;
                this.reconnectAttempts++;
                this.connect(this.token ?? undefined);
            }, delay);
        }
    }

    private isCurrentSocket(socket: WebSocket, connectionId: number): boolean {
        return this.socket === socket && this.connectionId === connectionId;
    }

    private clearReconnectTimeout(): void {
        if (this.reconnectTimeout !== null) {
            globalThis.clearTimeout(this.reconnectTimeout);
            this.reconnectTimeout = null;
        }
    }

    private closeSocket(): void {
        if (!this.socket) return;

        if (this.socketListeners) {
            this.socket.removeEventListener('open', this.socketListeners.open);
            this.socket.removeEventListener(
                'message',
                this.socketListeners.message,
            );
            this.socket.removeEventListener(
                'error',
                this.socketListeners.error,
            );
            this.socket.removeEventListener(
                'close',
                this.socketListeners.close,
            );
            this.socketListeners = null;
        }
        this.socket.close();
        this.socket = null;
    }

    private authenticate(token: string): void {
        console.log('[WS] Authenticating...');
        this.send(WsEvents.AUTHENTICATE, { token });
    }

    private startPing(): void {
        this.stopPing();
        this.pingInterval = globalThis.setInterval((): void => {
            if (this.socket?.readyState !== WebSocket.OPEN) return;
            this.send(WsEvents.PING);
            this.expectPong();
        }, 30_000);
    }

    private stopPing(): void {
        if (this.pingInterval !== null) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        this.clearPongTimeout();
    }

    /**
     * Arm a timeout after sending a ping. If no traffic arrives before it fires,
     * the connection is considered dead (e.g. a half-open socket left behind by a
     * dropped network link) and we force a reconnect. Any inbound message clears
     * this via {@link handleMessage}.
     */
    private expectPong(): void {
        this.clearPongTimeout();
        this.pongTimeout = globalThis.setTimeout((): void => {
            this.pongTimeout = null;
            console.warn('[WS] Heartbeat timed out, forcing reconnect');
            this.forceReconnect();
        }, this.heartbeatTimeoutMs);
    }

    private clearPongTimeout(): void {
        if (this.pongTimeout !== null) {
            globalThis.clearTimeout(this.pongTimeout);
            this.pongTimeout = null;
        }
    }

    /**
     * Tear down the current socket without waiting for its `onclose` (which may
     * never fire on a half-open connection) and immediately reconnect.
     */
    private forceReconnect(): void {
        if (!this.token) return;

        this.stopPing();
        this.isAuthenticated = false;
        this.closeSocket();
        this.setState('disconnected');
        this.emit(WsEvents.DISCONNECTED, {
            code: 0,
            reason: 'heartbeat-timeout',
        });
        this.reconnectAttempts = 0;
        this.connect(this.token);
    }

    /**
     * Re-establish the connection if it is not healthy. Intended to be called
     * when the browser reports the network is back (`online`) or the tab becomes
     * visible again. If the socket still looks open, we ping it to confirm it is
     * actually alive rather than trusting a possibly stale `readyState`.
     */
    public reconnectIfNeeded(): void {
        if (!this.token) return;

        if (
            this.socket?.readyState === WebSocket.OPEN &&
            this.isAuthenticated
        ) {
            this.send(WsEvents.PING);
            this.expectPong();
            return;
        }

        if (this.socket?.readyState === WebSocket.CONNECTING) return;

        this.reconnectAttempts = 0;
        this.connect(this.token);
    }
}

export const wsClient = new WsClient();
