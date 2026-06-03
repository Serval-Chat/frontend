import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    SERVERS_QUERY_KEYS,
    useAddRoleToMember,
    useRemoveRoleFromMember,
} from '@/api/servers/servers.queries';
import type { ServerMember } from '@/api/servers/servers.types';

import { serversApi } from './servers.api';

vi.mock('@/api/servers/servers.api', () => ({
    serversApi: {
        addRoleToMember: vi.fn(),
        removeRoleFromMember: vi.fn(),
    },
}));

vi.mock('@/ui/components/common/Toast', () => ({
    useToast: () => ({
        showToast: vi.fn(),
    }),
}));

const makeHarness = (): {
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

describe('server role member mutations', (): void => {
    const serverId = 'server-1';
    const userId = 'user-1';
    const roleId = 'role-can-see-private';
    const memberWithoutRole: ServerMember = {
        id: 'member-1',
        userId,
        serverId,
        roles: [],
        joinedAt: '2026-05-26T00:00:00.000Z',
        user: {
            id: userId,
            login: 'visible-tester',
            username: 'Visible Tester',
            createdAt: new Date('2026-05-26T00:00:00.000Z'),
        },
    };
    const memberWithRole: ServerMember = {
        ...memberWithoutRole,
        roles: [roleId],
    };

    beforeEach((): void => {
        vi.clearAllMocks();
    });

    it('refreshes channel and category visibility after adding a role', async (): Promise<void> => {
        const { queryClient, wrapper } = makeHarness();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        queryClient.setQueryData<ServerMember[]>(
            SERVERS_QUERY_KEYS.members(serverId),
            [memberWithoutRole],
        );
        vi.mocked(serversApi.addRoleToMember).mockResolvedValue(memberWithRole);

        const { result } = renderHook(() => useAddRoleToMember(serverId), {
            wrapper,
        });

        act((): void => {
            result.current.mutate({ userId, roleId });
        });

        await waitFor((): void => expect(result.current.isSuccess).toBe(true));

        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: SERVERS_QUERY_KEYS.channels(serverId),
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: SERVERS_QUERY_KEYS.categories(serverId),
        });
    });

    it('refreshes channel and category visibility after removing a role', async (): Promise<void> => {
        const { queryClient, wrapper } = makeHarness();
        const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');

        queryClient.setQueryData<ServerMember[]>(
            SERVERS_QUERY_KEYS.members(serverId),
            [memberWithRole],
        );
        vi.mocked(serversApi.removeRoleFromMember).mockResolvedValue(
            memberWithoutRole,
        );

        const { result } = renderHook(() => useRemoveRoleFromMember(serverId), {
            wrapper,
        });

        act((): void => {
            result.current.mutate({ userId, roleId });
        });

        await waitFor((): void => expect(result.current.isSuccess).toBe(true));

        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: SERVERS_QUERY_KEYS.channels(serverId),
        });
        expect(invalidateSpy).toHaveBeenCalledWith({
            queryKey: SERVERS_QUERY_KEYS.categories(serverId),
        });
    });
});
