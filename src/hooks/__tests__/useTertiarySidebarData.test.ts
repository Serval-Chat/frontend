import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as ServerQueries from '@/api/servers/servers.queries';
import type { Role, Server, ServerMember } from '@/api/servers/servers.types';
import * as UserQueries from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useTertiarySidebarData } from '@/hooks/useTertiarySidebarData';
import { useAppSelector } from '@/store/hooks';

vi.mock('@/api/servers/servers.queries', () => ({
    useCategories: vi.fn(),
    useChannels: vi.fn(),
    useMembers: vi.fn(),
    useRoles: vi.fn(),
    useServerDetails: vi.fn(),
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn(),
    useUserById: vi.fn(),
}));

vi.mock('@/store/hooks', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('react-router-dom', () => ({
    useLocation: vi.fn().mockReturnValue({
        pathname: '/chat/@server/url-server/channel/url-channel',
    }),
    useParams: vi.fn().mockReturnValue({ serverId: 'url-server' }),
}));

describe('useTertiarySidebarData', (): void => {
    const mockMember = {
        userId: 'user-1',
        roles: ['role-1'],
        user: { id: 'user-1', username: 'Alice' },
    } as ServerMember;
    const mockRole = {
        id: 'role-1',
        name: 'Member',
        position: 1,
        permissions: { viewChannels: true },
    } as Role;

    beforeEach((): void => {
        vi.clearAllMocks();

        vi.mocked(useAppSelector).mockImplementation((selector) =>
            selector({
                nav: {
                    selectedFriendId: null,
                    selectedChannelId: null,
                    selectedServerId: null,
                    splitView: { left: null, right: null },
                },
            } as never),
        );
        vi.mocked(UserQueries.useMe).mockReturnValue({
            data: { id: 'me', username: 'Me' } as User,
        } as never);
        vi.mocked(UserQueries.useUserById).mockReturnValue({
            data: undefined,
        } as never);
        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: { id: 'pane-server', name: 'Pane Server' } as Server,
        } as never);
        vi.mocked(ServerQueries.useMembers).mockReturnValue({
            data: [mockMember],
            isLoading: false,
        } as never);
        vi.mocked(ServerQueries.useRoles).mockReturnValue({
            data: [mockRole],
        } as never);
        vi.mocked(ServerQueries.useChannels).mockReturnValue({
            data: [],
        } as never);
        vi.mocked(ServerQueries.useCategories).mockReturnValue({
            data: [],
        } as never);
    });

    it('enables server member queries for explicit split-view sidebar context', (): void => {
        const { result } = renderHook(() =>
            useTertiarySidebarData({
                selectedServerId: 'pane-server',
                selectedFriendId: null,
                ignoreUrlMatch: true,
            }),
        );

        expect(ServerQueries.useMembers).toHaveBeenCalledWith('pane-server', {
            enabled: true,
        });
        expect(ServerQueries.useRoles).toHaveBeenCalledWith('pane-server', {
            enabled: true,
        });
        expect(ServerQueries.useChannels).toHaveBeenCalledWith('pane-server', {
            enabled: false,
        });
        expect(result.current.selectedServerId).toBe('pane-server');
        expect(result.current.members).toEqual([mockMember]);
    });

    it('keeps route mismatches disabled outside explicit split-view context', (): void => {
        renderHook(() =>
            useTertiarySidebarData({
                selectedServerId: 'pane-server',
                selectedFriendId: null,
            }),
        );

        expect(ServerQueries.useMembers).toHaveBeenCalledWith('pane-server', {
            enabled: false,
        });
    });

    it('filters server members that cannot view the selected channel', (): void => {
        const visibleMember = {
            userId: 'visible-user',
            roles: ['visible-role'],
            user: { id: 'visible-user', username: 'Visible' },
        } as ServerMember;
        const hiddenMember = {
            userId: 'hidden-user',
            roles: ['hidden-role'],
            user: { id: 'hidden-user', username: 'Hidden' },
        } as ServerMember;

        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: {
                id: 'pane-server',
                ownerId: 'owner-user',
                name: 'Pane Server',
            } as Server,
        } as never);
        vi.mocked(ServerQueries.useMembers).mockReturnValue({
            data: [visibleMember, hiddenMember],
            isLoading: false,
        } as never);
        vi.mocked(ServerQueries.useRoles).mockReturnValue({
            data: [
                {
                    id: 'visible-role',
                    name: 'Visible',
                    position: 2,
                    permissions: { viewChannels: true },
                },
                {
                    id: 'hidden-role',
                    name: 'Hidden',
                    position: 1,
                    permissions: { viewChannels: true },
                },
            ] as Role[],
        } as never);
        vi.mocked(ServerQueries.useChannels).mockReturnValue({
            data: [
                {
                    id: 'channel-1',
                    name: 'Secret',
                    permissions: {
                        'visible-role': { viewChannels: true },
                        'hidden-role': { viewChannels: false },
                    },
                },
            ],
        } as never);

        const { result } = renderHook(() =>
            useTertiarySidebarData({
                selectedChannelId: 'channel-1',
                selectedServerId: 'pane-server',
                selectedFriendId: null,
                ignoreUrlMatch: true,
            }),
        );

        expect(result.current.members).toEqual([visibleMember]);
    });
});
