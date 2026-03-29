import type { Dispatch, UnknownAction } from '@reduxjs/toolkit';
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

describe('Voice Synchronization WS Handlers', () => {
    let mockWs: MockWebSocket;
    let queryClient: QueryClient;
    let mockDispatch: ReturnType<typeof vi.fn>;
    let dispatch: Dispatch<UnknownAction>;
    let cleanup: () => void;

    beforeEach(() => {
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
        };

        class WebSocketMock {
            static CONNECTING = 0;
            static OPEN = 1;
            static CLOSING = 2;
            static CLOSED = 3;
            constructor() {
                return mockWs as unknown as WebSocket;
            }
        }
        vi.stubGlobal('WebSocket', WebSocketMock);

        wsClient.connect('test-token');

        queryClient = new QueryClient({
            defaultOptions: { queries: { retry: false } },
        });

        mockDispatch = vi.fn();
        dispatch = mockDispatch as unknown as Dispatch<UnknownAction>;

        cleanup = setupGlobalWsHandlers(queryClient, dispatch);
    });

    afterEach(() => {
        cleanup();
        queryClient.clear();
    });

    it('handles VOICE_JOINED properly by atomically setting all participants and states', () => {
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

    it('handles USER_JOINED_VOICE properly', () => {
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

    it('handles USER_LEFT_VOICE properly', () => {
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

    it('handles VOICE_STATE_UPDATED properly', () => {
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
