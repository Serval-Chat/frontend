import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { botsApi } from '@/api/developer/bots.api';
import {
    useAuthorizeBot,
    useBots,
    useCreateBot,
    useDeleteBot,
    usePublicBotInfo,
} from '@/hooks/developer/useBots';
import type { Bot, PublicBotInfo } from '@/types/bot';

vi.mock('@/api/developer/bots.api', () => ({
    botsApi: {
        getPublicInfo: vi.fn(),
        list: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updatePermissions: vi.fn(),
        delete: vi.fn(),
        resetSecret: vi.fn(),
        authorize: vi.fn(),
        getServers: vi.fn(),
        removeFromServer: vi.fn(),
    },
}));

const makeWrapper = (): React.FC<{ children: React.ReactNode }> => {
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
    return Wrapper;
};

const mockPermissions = {
    readMessages: true,
    sendMessages: true,
    manageMessages: false,
    readUsers: false,
    joinServers: true,
    manageServer: false,
    manageChannels: false,
    manageMembers: false,
    readReactions: false,
    addReactions: false,
};

const mockPublicInfo: PublicBotInfo = {
    clientId: 'abc123',
    username: 'mybot',
    displayName: 'My Bot',
    botPermissions: mockPermissions,
    serverCount: 5,
};

const mockBot: Bot = {
    _id: 'botid1',
    clientId: 'abc123',
    ownerId: 'owner1',
    userId: 'userid1',
    botPermissions: mockPermissions,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
};

describe('usePublicBotInfo', () => {
    beforeEach(() => vi.clearAllMocks());

    it('fetches public bot info', async () => {
        vi.mocked(botsApi.getPublicInfo).mockResolvedValue(mockPublicInfo);
        const { result } = renderHook(() => usePublicBotInfo('abc123'), {
            wrapper: makeWrapper(),
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(mockPublicInfo);
        expect(botsApi.getPublicInfo).toHaveBeenCalledWith('abc123');
    });

    it('is disabled when clientId is empty', () => {
        const { result } = renderHook(() => usePublicBotInfo(''), {
            wrapper: makeWrapper(),
        });
        expect(result.current.fetchStatus).toBe('idle');
        expect(botsApi.getPublicInfo).not.toHaveBeenCalled();
    });

    it('surfaces errors from the api', async () => {
        vi.mocked(botsApi.getPublicInfo).mockRejectedValue(
            new Error('Not found'),
        );
        const { result } = renderHook(() => usePublicBotInfo('badid'), {
            wrapper: makeWrapper(),
        });
        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error?.message).toBe('Not found');
    });
});

describe('useBots', () => {
    beforeEach(() => vi.clearAllMocks());

    it('fetches the owned bot list', async () => {
        vi.mocked(botsApi.list).mockResolvedValue([mockBot]);
        const { result } = renderHook(() => useBots(), {
            wrapper: makeWrapper(),
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toHaveLength(1);
        expect(result.current.data![0].clientId).toBe('abc123');
    });

    it('returns empty array when user has no bots', async () => {
        vi.mocked(botsApi.list).mockResolvedValue([]);
        const { result } = renderHook(() => useBots(), {
            wrapper: makeWrapper(),
        });
        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual([]);
    });
});

describe('useCreateBot', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls api and returns bot with one-time secret', async () => {
        const response = { bot: mockBot, clientSecret: 'supersecret' };
        vi.mocked(botsApi.create).mockResolvedValue(response);
        const { result } = renderHook(() => useCreateBot(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate({ name: 'My Bot' });
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(result.current.data).toEqual(response);
        expect(botsApi.create).toHaveBeenCalledWith({ name: 'My Bot' });
    });

    it('surfaces creation errors', async () => {
        vi.mocked(botsApi.create).mockRejectedValue(
            new Error('Maximum 25 bots per user'),
        );
        const { result } = renderHook(() => useCreateBot(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate({ name: 'Bot' });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error?.message).toBe('Maximum 25 bots per user');
    });
});

describe('useAuthorizeBot', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls authorize api with correct clientId and serverId', async () => {
        const response = { serverId: 'srv1', serverName: 'My Server' };
        vi.mocked(botsApi.authorize).mockResolvedValue(response);
        const { result } = renderHook(() => useAuthorizeBot(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate({ clientId: 'abc123', serverId: 'srv1' });
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(botsApi.authorize).toHaveBeenCalledWith(
            'abc123',
            'srv1',
            undefined,
        );
        expect(result.current.data).toEqual(response);
    });

    it('surfaces conflict error when bot already in server', async () => {
        vi.mocked(botsApi.authorize).mockRejectedValue(
            new Error('Bot is already in this server'),
        );
        const { result } = renderHook(() => useAuthorizeBot(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate({ clientId: 'abc123', serverId: 'srv1' });
        });

        await waitFor(() => expect(result.current.isError).toBe(true));
        expect(result.current.error?.message).toBe(
            'Bot is already in this server',
        );
    });
});

describe('useDeleteBot', () => {
    beforeEach(() => vi.clearAllMocks());

    it('calls delete api with clientId', async () => {
        vi.mocked(botsApi.delete).mockResolvedValue(undefined);
        const { result } = renderHook(() => useDeleteBot(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate({ clientId: 'abc123' });
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(botsApi.delete).toHaveBeenCalledWith('abc123');
    });
});
