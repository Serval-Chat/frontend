import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { useDispatch } from 'react-redux';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { SERVERS_QUERY_KEYS } from '@/api/servers/servers.queries';
import {
    decrementServerPing,
    setServerPingCount,
} from '@/store/slices/unreadSlice';
import { hasAuthToken } from '@/utils/authToken';

import { pingsApi } from './pings.api';
import {
    PINGS_KEYS,
    useClearChannelPings,
    useDeletePing,
    usePings,
} from './pings.queries';
import type { PingNotification } from './pings.types';

vi.mock('./pings.api', () => ({
    pingsApi: {
        getPings: vi.fn(),
        deletePing: vi.fn(),
        clearChannelPings: vi.fn(),
    },
}));

vi.mock('@/utils/authToken', () => ({
    hasAuthToken: vi.fn(() => true),
}));

vi.mock('react-redux', () => ({
    useDispatch: vi.fn(),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    SERVERS_QUERY_KEYS: {
        all: ['servers'],
        unread: (): readonly ['servers', 'unread'] =>
            ['servers', 'unread'] as const,
    },
}));

type MentionPing = Extract<PingNotification, { type: 'mention' }>;

const serverPing: MentionPing = {
    id: '0362009044010926080',
    type: 'mention',
    sender: 'cat',
    senderId: '0265935371727011840',
    serverId: 'srv-1',
    channelId: 'ch-1',
    timestamp: 1790000000000,
    message: {
        messageId: '0362009044010926081',
        text: 'alice: hi',
        createdAt: '2026-09-25T22:54:41.894Z',
    },
};

const dmPing: MentionPing = {
    id: '0362009044010926082',
    type: 'mention',
    sender: 'gorciu',
    senderId: '0265935371727011841',
    timestamp: 1790000001000,
    message: {
        messageId: '0362009044010926083',
        text: 'dm hi',
        createdAt: '2026-09-25T22:54:41.894Z',
    },
};

const makeWrapper = (): {
    queryClient: QueryClient;
    wrapper: React.FC<{ children: React.ReactNode }>;
} => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    const Wrapper = ({
        children,
    }: {
        children: React.ReactNode;
    }): React.ReactElement =>
        React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children,
        );
    Wrapper.displayName = 'QueryClientWrapper';
    return { queryClient, wrapper: Wrapper };
};

describe('usePings', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(hasAuthToken).mockReturnValue(true);
    });

    it('loads the pings list into the shared cache when a token exists', async () => {
        vi.mocked(pingsApi.getPings).mockResolvedValue({
            pings: [serverPing],
        });
        const { queryClient, wrapper } = makeWrapper();

        const { result } = renderHook(() => usePings(), { wrapper });

        await waitFor(() => {
            expect(result.current.data).toEqual({ pings: [serverPing] });
        });
        expect(pingsApi.getPings).toHaveBeenCalledTimes(1);
        expect(queryClient.getQueryData(PINGS_KEYS.all)).toEqual({
            pings: [serverPing],
        });
    });

    it('never fetches while logged out', async () => {
        vi.mocked(hasAuthToken).mockReturnValue(false);
        const { wrapper } = makeWrapper();

        renderHook(() => usePings(), { wrapper });
        await new Promise((resolve) => setTimeout(resolve, 20));

        expect(pingsApi.getPings).not.toHaveBeenCalled();
    });
});

describe('useDeletePing', () => {
    let dispatch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(hasAuthToken).mockReturnValue(true);
        dispatch = vi.fn();
        vi.mocked(useDispatch).mockReturnValue(dispatch as never);
    });

    it('drops the ping from the cache, decrements the server badge and refreshes unread state', async () => {
        vi.mocked(pingsApi.deletePing).mockResolvedValue({ success: true });
        const { queryClient, wrapper } = makeWrapper();
        queryClient.setQueryData(PINGS_KEYS.all, {
            pings: [serverPing, dmPing],
        });
        queryClient.setQueryData(SERVERS_QUERY_KEYS.unread(), {
            'srv-1': { pingCount: 2 },
        });
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useDeletePing(), { wrapper });

        await result.current.mutateAsync(serverPing.id);

        expect(pingsApi.deletePing).toHaveBeenCalledWith(
            serverPing.id,
            expect.anything(),
        );
        expect(queryClient.getQueryData(PINGS_KEYS.all)).toEqual({
            pings: [dmPing],
        });
        expect(dispatch).toHaveBeenCalledWith(
            decrementServerPing({ serverId: 'srv-1' }),
        );
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: SERVERS_QUERY_KEYS.unread(),
        });
    });

    it('removes a DM ping without touching the server badge', async () => {
        vi.mocked(pingsApi.deletePing).mockResolvedValue({ success: true });
        const { queryClient, wrapper } = makeWrapper();
        queryClient.setQueryData(PINGS_KEYS.all, {
            pings: [serverPing, dmPing],
        });

        const { result } = renderHook(() => useDeletePing(), { wrapper });

        await result.current.mutateAsync(dmPing.id);

        expect(queryClient.getQueryData(PINGS_KEYS.all)).toEqual({
            pings: [serverPing],
        });
        expect(dispatch).not.toHaveBeenCalled();
    });

    it('leaves the cache alone when the deleted id is not cached', async () => {
        vi.mocked(pingsApi.deletePing).mockResolvedValue({
            success: false,
        });
        const { queryClient, wrapper } = makeWrapper();
        queryClient.setQueryData(PINGS_KEYS.all, { pings: [serverPing] });

        const { result } = renderHook(() => useDeletePing(), { wrapper });

        await result.current.mutateAsync('0362009044010926999');

        expect(queryClient.getQueryData(PINGS_KEYS.all)).toEqual({
            pings: [serverPing],
        });
        expect(dispatch).not.toHaveBeenCalled();
    });
});

describe('useClearChannelPings', () => {
    let dispatch: ReturnType<typeof vi.fn>;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(hasAuthToken).mockReturnValue(true);
        dispatch = vi.fn();
        vi.mocked(useDispatch).mockReturnValue(dispatch as never);
    });

    it('removes only pings for that channel, recalculates the badge and refreshes unread state', async () => {
        const ch1PingA: MentionPing = { ...serverPing };
        const ch1PingB: MentionPing = {
            ...serverPing,
            id: '0362009044010926084',
            message: {
                ...serverPing.message,
                messageId: '0362009044010926085',
            },
        };
        const ch2Ping: MentionPing = {
            ...serverPing,
            id: '0362009044010926086',
            channelId: 'ch-2',
            message: {
                ...serverPing.message,
                messageId: '0362009044010926087',
            },
        };
        vi.mocked(pingsApi.clearChannelPings).mockResolvedValue({
            success: true,
            clearedCount: 2,
        });
        const { queryClient, wrapper } = makeWrapper();
        queryClient.setQueryData(PINGS_KEYS.all, {
            pings: [ch1PingA, ch1PingB, ch2Ping],
        });
        queryClient.setQueryData(SERVERS_QUERY_KEYS.unread(), {
            'srv-1': { pingCount: 2 },
        });
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        const { result } = renderHook(() => useClearChannelPings(), {
            wrapper,
        });

        await result.current.mutateAsync('ch-1');

        expect(pingsApi.clearChannelPings).toHaveBeenCalledWith(
            'ch-1',
            expect.anything(),
        );
        expect(queryClient.getQueryData(PINGS_KEYS.all)).toEqual({
            pings: [ch2Ping],
        });
        expect(dispatch).toHaveBeenCalledWith(
            setServerPingCount({ serverId: 'srv-1', count: 0 }),
        );
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: SERVERS_QUERY_KEYS.unread(),
        });
    });

    it('does not dispatch when no cached ping belongs to the channel', async () => {
        vi.mocked(pingsApi.clearChannelPings).mockResolvedValue({
            success: true,
            clearedCount: 0,
        });
        const { queryClient, wrapper } = makeWrapper();
        queryClient.setQueryData(PINGS_KEYS.all, { pings: [serverPing] });

        const { result } = renderHook(() => useClearChannelPings(), {
            wrapper,
        });

        await result.current.mutateAsync('ch-9');

        expect(queryClient.getQueryData(PINGS_KEYS.all)).toEqual({
            pings: [serverPing],
        });
        expect(dispatch).not.toHaveBeenCalled();
    });
});
