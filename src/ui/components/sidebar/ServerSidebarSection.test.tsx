import { render, screen } from '@testing-library/react';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Role, ServerMember } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useAppSelector } from '@/store/hooks';
import { ServerSidebarSection } from '@/ui/components/sidebar/ServerSidebarSection';

// Mock dependencies
vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn(),
}));

vi.mock('@/store/hooks', () => ({
    useAppSelector: vi.fn(),
}));

vi.mock('@/ui/components/common/LoadingSpinner', () => ({
    LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

vi.mock('@/ui/components/common/UserItem', () => ({
    UserItem: ({ user, role }: { user: User; role?: Role }) => (
        <div
            data-displayname={user.displayName || ''}
            data-role={role?.name || 'none'}
            data-testid={`user-item-${user._id}`}
            data-username={user.username}
        >
            {user.displayName || user.username}
        </div>
    ),
}));

describe('ServerSidebarSection', () => {
    const mockMe = { _id: 'me-id', username: 'Me' } as User;
    const mockRoles: Role[] = [
        {
            _id: 'role-admin',
            name: 'Admin',
            position: 10,
            separateFromOtherRoles: true,
        } as Role,
        {
            _id: 'role-mod',
            name: 'Moderator',
            position: 5,
            separateFromOtherRoles: true,
        } as Role,
        {
            _id: 'role-default',
            name: 'Member',
            position: 1,
            separateFromOtherRoles: false,
        } as Role,
    ];

    const mockMembers: ServerMember[] = [
        {
            _id: 'm1',
            userId: 'u1',
            serverId: 'srv-1',
            user: {
                _id: 'u1',
                username: 'Alice',
                displayName: 'Alice Display',
            } as User,
            roles: ['role-admin'],
            joinedAt: new Date().toISOString(),
        },
        {
            _id: 'm2',
            userId: 'u2',
            serverId: 'srv-1',
            user: { _id: 'u2', username: 'Charlie' } as User,
            roles: ['role-mod'],
            joinedAt: new Date().toISOString(),
        },
        {
            _id: 'm3',
            userId: 'u3',
            serverId: 'srv-1',
            user: { _id: 'u3', username: 'Bob' } as User,
            roles: ['role-admin'],
            joinedAt: new Date().toISOString(),
        },
        {
            _id: 'm4',
            userId: 'u4',
            serverId: 'srv-1',
            user: { _id: 'u4', username: 'Dave' } as User,
            roles: ['role-default'],
            joinedAt: new Date().toISOString(),
        },
    ];

    const memberRoleMap = new Map<string, Role>();
    memberRoleMap.set('u1', mockRoles[0]);
    memberRoleMap.set('u2', mockRoles[1]);
    memberRoleMap.set('u3', mockRoles[0]);
    memberRoleMap.set('u4', mockRoles[2]);

    beforeEach(() => {
        vi.clearAllMocks();
        // Default: everyone is offline except 'me'
        (useMe as Mock).mockReturnValue({ data: mockMe });
        (useAppSelector as Mock).mockReturnValue({}); // presenceMap is empty
    });

    it('ranks and groups members by separated roles and online status', () => {
        // Set u1, u2, u3 as online
        (useAppSelector as Mock).mockReturnValue({
            u1: { status: 'online' },
            u2: { status: 'online' },
            u3: { status: 'online' },
        });

        render(
            <ServerSidebarSection
                isLoading={false}
                memberRoleMap={memberRoleMap}
                members={mockMembers}
                roles={mockRoles}
            />,
        );

        expect(screen.getByText(/Admin - 2/)).toBeDefined();
        expect(screen.getByText(/Moderator - 1/)).toBeDefined();
        expect(screen.getByText(/Offline - 1/)).toBeDefined();

        expect(screen.getByTestId('user-item-u1')).toBeDefined();
        expect(screen.getByTestId('user-item-u3')).toBeDefined();
        expect(screen.getByTestId('user-item-u2')).toBeDefined();
        expect(screen.getByTestId('user-item-u4')).toBeDefined();
    });

    it('sorts members alphabetically within each group', () => {
        // Set all as online
        (useAppSelector as Mock).mockReturnValue({
            u1: { status: 'online' },
            u2: { status: 'online' },
            u3: { status: 'online' },
            u4: { status: 'online' },
        });

        render(
            <ServerSidebarSection
                isLoading={false}
                memberRoleMap={memberRoleMap}
                members={mockMembers}
                roles={mockRoles}
            />,
        );

        const adminItems = screen.getAllByTestId(/user-item-u[13]/);
        expect(adminItems[0].getAttribute('data-testid')).toBe('user-item-u1'); // Alice Display
        expect(adminItems[1].getAttribute('data-testid')).toBe('user-item-u3'); // Bob
    });

    it('moves a user to Offline group when they go offline', async () => {
        // Initial state: u1 is online
        (useAppSelector as Mock).mockReturnValue({
            u1: { status: 'online' },
        });

        const { rerender } = render(
            <ServerSidebarSection
                isLoading={false}
                memberRoleMap={memberRoleMap}
                members={[mockMembers[0]]} // Only Alice
                roles={mockRoles}
            />,
        );

        expect(screen.getByText(/Admin - 1/)).toBeDefined();
        expect(screen.queryByText(/Offline/)).toBeNull();

        // Update presence: u1 goes offline
        (useAppSelector as Mock).mockReturnValue({
            u1: { status: 'offline' },
        });

        rerender(
            <ServerSidebarSection
                isLoading={false}
                memberRoleMap={memberRoleMap}
                members={[mockMembers[0]]}
                roles={mockRoles}
            />,
        );

        expect(screen.queryByText(/Admin/)).toBeNull();
        expect(screen.getByText(/Offline - 1/)).toBeDefined();
    });

    it('respects role separation permissions', () => {
        // Dave (u4) is online. His highest role "Member" is NOT separated.
        (useAppSelector as Mock).mockReturnValue({
            u4: { status: 'online' },
        });

        render(
            <ServerSidebarSection
                isLoading={false}
                memberRoleMap={memberRoleMap}
                members={[mockMembers[3]]}
                roles={mockRoles}
            />,
        );

        expect(screen.getByText(/Online - 1/)).toBeDefined();
        expect(screen.queryByText(/Member/)).toBeNull();
    });
});
