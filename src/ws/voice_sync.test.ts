import type { Dispatch } from '@reduxjs/toolkit';
import { QueryClient } from '@tanstack/react-query';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    addVoiceParticipant,
    removeVoiceParticipant,
    setVoiceParticipants,
    setVoiceUserState,
} from '@/store/slices/voiceSlice';

import { wsClient } from './client';
import { WsEvents } from './events';
import { setupGlobalWsHandlers } from './handlers';

interface MockWebSocket {
    send: ReturnType<typeof vi.fn>;
    close: ReturnType<typeof vi.fn>;
    readyState: number;
    onopen: ((ev: Event) => void) | null;
    onmessage: ((ev: MessageEvent) => void) | null;
    onerror: ((ev: Event) => void) | null;
    onclose: ((ev: CloseEvent) => void) | null;
    addEventListener: ReturnType<typeof vi.fn>;
    removeEventListener: ReturnType<typeof vi.fn>;
}

function emitWsEvent(
    mockWs: MockWebSocket,
    type: string,
    payload: unknown,
): void {
    if (!mockWs.onmessage) return;
    mockWs.onmessage({
        data: JSON.stringify({
            event: { type, payload },
            meta: { ts: Date.now() },
        }),
    } as MessageEvent);
}

describe('Voice Synchronization WS Handlers', (): void => {
    let mockWs: MockWebSocket;
    let queryClient: QueryClient;
    let mockDispatch: ReturnType<typeof vi.fn>;
    let dispatch: Dispatch;
    let cleanup: () => void;

    beforeEach((): void => {
        vi.clearAllMocks();
        wsClient.disconnect();

        mockWs = {
            send: vi.fn(),
            close: vi.fn(),
            readyState: 1,
            onopen: null,
            onmessage: null,
            onerror: null,
            onclose: null,
            addEventListener: vi.fn((event: string, handler: any) => {
                (mockWs as any)[`on${event}`] = handler;
            }),
            removeEventListener: vi.fn((event: string, handler: any) => {
                if ((mockWs as any)[`on${event}`] === handler) {
                    (mockWs as any)[`on${event}`] = null;
                }
            }),
        };

        function WebSocketMock(): MockWebSocket {
            return mockWs;
        }

        Object.assign(WebSocketMock, {
            CONNECTING: 0,
            OPEN: 1,
            CLOSING: 2,
            CLOSED: 3,
        });

        vi.stubGlobal('WebSocket', WebSocketMock);

        wsClient.connect('test-token');

        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        mockDispatch = vi.fn();
        dispatch = mockDispatch as any as Dispatch;

        cleanup = setupGlobalWsHandlers(queryClient, dispatch);
    });

    afterEach((): void => {
        cleanup();
        queryClient.clear();
    });

    it('handles VOICE_JOINED properly by atomically setting all participants and states', (): void => {
        const payload = {
            success: true,
            serverId: 'server-1',
            channelId: 'channel-1',
            participants: ['user-1', 'user-2'],
            voiceStates: {
                'user-1': { isMuted: true, isDeafened: false },
                'user-2': { isMuted: true, isDeafened: true },
            },
        };

        emitWsEvent(mockWs, WsEvents.VOICE_JOINED, payload);

        expect(mockDispatch).toHaveBeenCalledWith(
            setVoiceParticipants({
                channelId: 'channel-1',
                userIds: ['user-1', 'user-2'],
            }),
        );

        // Should dispatch setVoiceUserState for each user
        expect(mockDispatch).toHaveBeenCalledWith(
            setVoiceUserState({
                userId: 'user-1',
                isMuted: true,
                isDeafened: false,
            }),
        );
        expect(mockDispatch).toHaveBeenCalledWith(
            setVoiceUserState({
                userId: 'user-2',
                isMuted: true,
                isDeafened: true,
            }),
        );
    });

    it('handles USER_JOINED_VOICE properly', (): void => {
        const payload = {
            serverId: 'server-1',
            channelId: 'channel-1',
            userId: 'user-3',
        };

        emitWsEvent(mockWs, WsEvents.USER_JOINED_VOICE, payload);

        expect(mockDispatch).toHaveBeenCalledWith(
            addVoiceParticipant({ channelId: 'channel-1', userId: 'user-3' }),
        );
    });

    it('handles USER_LEFT_VOICE properly', (): void => {
        const payload = {
            serverId: 'server-1',
            channelId: 'channel-1',
            userId: 'user-3',
        };

        emitWsEvent(mockWs, WsEvents.USER_LEFT_VOICE, payload);

        expect(mockDispatch).toHaveBeenCalledWith(
            removeVoiceParticipant({
                channelId: 'channel-1',
                userId: 'user-3',
            }),
        );
    });

    it('handles VOICE_STATE_UPDATED properly', (): void => {
        const payload = {
            userId: 'user-1',
            isMuted: false,
            isDeafened: false,
        };

        emitWsEvent(mockWs, WsEvents.VOICE_STATE_UPDATED, payload);

        expect(mockDispatch).toHaveBeenCalledWith(
            setVoiceUserState({
                userId: 'user-1',
                isMuted: false,
                isDeafened: false,
            }),
        );
    });
});
