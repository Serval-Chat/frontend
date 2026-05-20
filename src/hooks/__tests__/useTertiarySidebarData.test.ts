import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as ServerQueries from '@/api/servers/servers.queries';
import type { Role, Server, ServerMember } from '@/api/servers/servers.types';
import * as UserQueries from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useTertiarySidebarData } from '@/hooks/useTertiarySidebarData';
import { useAppSelector } from '@/store/hooks';

vi.mock('@/api/servers/servers.queries', () => ({
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

describe('useTertiarySidebarData', () => {
    const mockMember = {
        userId: 'user-1',
        roles: ['role-1'],
        user: { _id: 'user-1', username: 'Alice' },
    } as ServerMember;
    const mockRole = {
        _id: 'role-1',
        name: 'Member',
        position: 1,
    } as Role;

    beforeEach(() => {
        vi.clearAllMocks();

        vi.mocked(useAppSelector).mockImplementation((selector) =>
            selector({
                nav: {
                    selectedFriendId: null,
                    selectedServerId: null,
                    splitView: { left: null, right: null },
                },
            } as never),
        );
        vi.mocked(UserQueries.useMe).mockReturnValue({
            data: { _id: 'me', username: 'Me' } as User,
        } as never);
        vi.mocked(UserQueries.useUserById).mockReturnValue({
            data: undefined,
        } as never);
        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: { _id: 'pane-server', name: 'Pane Server' } as Server,
        } as never);
        vi.mocked(ServerQueries.useMembers).mockReturnValue({
            data: [mockMember],
            isLoading: false,
        } as never);
        vi.mocked(ServerQueries.useRoles).mockReturnValue({
            data: [mockRole],
        } as never);
    });

    it('enables server member queries for explicit split-view sidebar context', () => {
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
        expect(result.current.selectedServerId).toBe('pane-server');
        expect(result.current.members).toEqual([mockMember]);
    });

    it('keeps route mismatches disabled outside explicit split-view context', () => {
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
});
