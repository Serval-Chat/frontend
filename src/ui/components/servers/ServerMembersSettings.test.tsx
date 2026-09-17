import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { useServerMembersAdmin } from '@/api/serverMembersAdmin/serverMembersAdmin.queries';
import type { ServerMemberAdminEntry } from '@/api/serverMembersAdmin/serverMembersAdmin.types';
import { useRoles } from '@/api/servers/servers.queries';
import type { Role } from '@/api/servers/servers.types';

import { ServerMembersSettings } from './ServerMembersSettings';

vi.mock('@/api/serverMembersAdmin/serverMembersAdmin.queries', () => ({
    useServerMembersAdmin: vi.fn(),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useRoles: vi.fn().mockReturnValue({ data: [] }),
}));

const moderatorRole: Role = {
    id: 'role-mod',
    serverId: 'server-1',
    name: 'Moderator',
    color: '#ff0000',
    position: 1,
};

const everyoneRole: Role = {
    id: 'role-everyone',
    serverId: 'server-1',
    name: '@everyone',
    color: null,
    position: 0,
};

const memberViaInvite: ServerMemberAdminEntry = {
    id: 'member-1',
    serverId: 'server-1',
    userId: 'user-1',
    roles: ['role-mod', 'role-everyone'],
    joinedAt: '2024-01-01T00:00:00.000Z',
    joinedVia: { method: 'invite', code: 'abc123' },
    user: {
        id: 'user-1',
        username: 'alice',
        displayName: 'Alice',
        createdAt: new Date('2023-01-01'),
    },
};

const memberWithoutJoinedVia: ServerMemberAdminEntry = {
    id: 'member-2',
    serverId: 'server-1',
    userId: 'user-2',
    roles: [],
    joinedAt: '2024-02-01T00:00:00.000Z',
    user: {
        id: 'user-2',
        username: 'bob',
        displayName: null,
        createdAt: new Date('2023-01-01'),
    },
};

describe('ServerMembersSettings', (): void => {
    beforeEach((): void => {
        vi.mocked(useRoles).mockReturnValue({
            data: [moderatorRole, everyoneRole],
        } as never);
    });

    afterEach((): void => {
        vi.restoreAllMocks();
    });

    it('shows an Invite badge with the invite code for a member who joined via invite', (): void => {
        vi.mocked(useServerMembersAdmin).mockReturnValue({
            data: { members: [memberViaInvite], total: 1, limit: 25, offset: 0 },
            isLoading: false,
            isFetching: false,
        } as never);

        render(<ServerMembersSettings serverId="server-1" />);

        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Moderator')).toBeInTheDocument();
        expect(screen.queryByText('@everyone')).not.toBeInTheDocument();
        expect(screen.getByText(/Invite:/)).toBeInTheDocument();
        expect(screen.getByText('abc123')).toBeInTheDocument();
    });

    it('shows the per-server nickname instead of the global display name when set', (): void => {
        const memberWithNickname: ServerMemberAdminEntry = {
            id: 'member-3',
            serverId: 'server-1',
            userId: 'user-3',
            nickname: 'Server Nick',
            roles: [],
            joinedAt: '2024-03-01T00:00:00.000Z',
            user: {
                id: 'user-3',
                username: 'charlie',
                displayName: 'Charlie Global',
                createdAt: new Date('2023-01-01'),
            },
        };
        vi.mocked(useServerMembersAdmin).mockReturnValue({
            data: {
                members: [memberWithNickname],
                total: 1,
                limit: 25,
                offset: 0,
            },
            isLoading: false,
            isFetching: false,
        } as never);

        render(<ServerMembersSettings serverId="server-1" />);

        expect(screen.getByText('Server Nick')).toBeInTheDocument();
        expect(screen.queryByText('Charlie Global')).not.toBeInTheDocument();
        expect(screen.getByText('@charlie')).toBeInTheDocument();
    });

    it('shows "Unknown" for a member with no joinedVia (e.g. the server owner)', (): void => {
        vi.mocked(useServerMembersAdmin).mockReturnValue({
            data: {
                members: [memberWithoutJoinedVia],
                total: 1,
                limit: 25,
                offset: 0,
            },
            isLoading: false,
            isFetching: false,
        } as never);

        render(<ServerMembersSettings serverId="server-1" />);

        expect(screen.getByText('bob')).toBeInTheDocument();
        expect(screen.getByText('Unknown')).toBeInTheDocument();
    });

    it('shows the empty state when there are no members', (): void => {
        vi.mocked(useServerMembersAdmin).mockReturnValue({
            data: { members: [], total: 0, limit: 25, offset: 0 },
            isLoading: false,
            isFetching: false,
        } as never);

        render(<ServerMembersSettings serverId="server-1" />);

        expect(screen.getByText('No members found')).toBeInTheDocument();
    });

    it('debounces the search box before forwarding it as a filter', (): void => {
        vi.useFakeTimers();
        vi.mocked(useServerMembersAdmin).mockReturnValue({
            data: { members: [], total: 0, limit: 25, offset: 0 },
            isLoading: false,
            isFetching: false,
        } as never);

        render(<ServerMembersSettings serverId="server-1" />);

        fireEvent.change(
            screen.getByPlaceholderText(
                'Search by username or display name...',
            ),
            { target: { value: 'ali' } },
        );

        expect(vi.mocked(useServerMembersAdmin)).toHaveBeenLastCalledWith(
            'server-1',
            expect.objectContaining({ search: undefined }),
            expect.anything(),
        );

        act((): void => {
            vi.advanceTimersByTime(300);
        });

        expect(vi.mocked(useServerMembersAdmin)).toHaveBeenLastCalledWith(
            'server-1',
            expect.objectContaining({ search: 'ali' }),
            expect.anything(),
        );

        vi.useRealTimers();
    });
});
