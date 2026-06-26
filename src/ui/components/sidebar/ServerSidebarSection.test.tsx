import { useVirtualizer } from '@tanstack/react-virtual';
import { fireEvent, render, screen } from '@testing-library/react';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';

import type { Role, ServerMember } from '@/api/servers/servers.types';
import { useMe } from '@/api/users/users.queries';
import type { User } from '@/api/users/users.types';
import { useAppSelector } from '@/store/hooks';
import { BlockFlags } from '@/types/blocks';
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

vi.mock('@/ui/components/common/UserItem', async () => {
    const { useState } = (await vi.importActual('react')) as any;
    return {
        UserItem: ({
            userId,
            user,
            role,
        }: {
            userId?: string;
            user?: User;
            role?: Role;
        }) => {
            const [showProfile, setShowProfile] = useState(false);
            const id = user?.id || userId || '';
            return (
                <div
                    data-displayname={user?.displayName || ''}
                    data-role={role?.name || 'none'}
                    data-testid={`user-item-${id}`}
                    data-username={user?.username}
                >
                    <button
                        data-testid={`open-profile-${id}`}
                        type="button"
                        onClick={() => setShowProfile(true)}
                    >
                        {user?.displayName || user?.username}
                    </button>
                    {showProfile && (
                        <div
                            data-testid="profile-popup"
                            data-userid={userId || id}
                        />
                    )}
                </div>
            );
        },
    };
});

vi.mock('@tanstack/react-virtual', () => ({
    useVirtualizer: vi.fn().mockImplementation((options: any) => ({
        getVirtualItems: (): { index: number; start: number; key: number }[] =>
            Array.from({ length: options.count }).map(
                (_, i): { index: number; start: number; key: number } => ({
                    index: i,
                    start: i * 44,
                    key: i,
                }),
            ),
        getTotalSize: (): number => options.count * 44,
        scrollToIndex: vi.fn(),
        measureElement: vi.fn(),
    })),
}));

const mockScrollRef = { current: document.createElement('div') };

describe('ServerSidebarSection', (): void => {
    const mockMe = { id: 'me-id', username: 'Me' } as User;
    const mockRoles: Role[] = [
        {
            id: 'role-admin',
            name: 'Admin',
            position: 10,
            separateFromOtherRoles: true,
        } as Role,
        {
            id: 'role-mod',
            name: 'Moderator',
            position: 5,
            separateFromOtherRoles: true,
        } as Role,
        {
            id: 'role-default',
            name: 'Member',
            position: 1,
            separateFromOtherRoles: false,
        } as Role,
    ];

    const mockMembers: ServerMember[] = [
        {
            id: 'm1',
            userId: 'u1',
            serverId: 'srv-1',
            user: {
                id: 'u1',
                username: 'Alice',
                displayName: 'Alice Display',
            } as User,
            roles: ['role-admin'],
            joinedAt: new Date().toISOString(),
        },
        {
            id: 'm2',
            userId: 'u2',
            serverId: 'srv-1',
            user: { id: 'u2', username: 'Charlie' } as User,
            roles: ['role-mod'],
            joinedAt: new Date().toISOString(),
        },
        {
            id: 'm3',
            userId: 'u3',
            serverId: 'srv-1',
            user: { id: 'u3', username: 'Bob' } as User,
            roles: ['role-admin'],
            joinedAt: new Date().toISOString(),
        },
        {
            id: 'm4',
            userId: 'u4',
            serverId: 'srv-1',
            user: { id: 'u4', username: 'Dave' } as User,
            roles: ['role-default'],
            joinedAt: new Date().toISOString(),
        },
    ];

    const memberRoleMap = new Map<string, Role>();
    memberRoleMap.set('u1', mockRoles[0]);
    memberRoleMap.set('u2', mockRoles[1]);
    memberRoleMap.set('u3', mockRoles[0]);
    memberRoleMap.set('u4', mockRoles[2]);

    const applySelectorState = ({
        presenceMap = {},
        blocks = {},
    }: {
        presenceMap?: Record<string, { status: 'online' | 'offline' }>;
        blocks?: Record<string, number>;
    }): void => {
        (useAppSelector as Mock).mockImplementation(
            (selector: (state: unknown) => unknown) =>
                selector({
                    presence: { users: presenceMap },
                    blocking: { blocks },
                }),
        );
    };

    const makeMember = ({
        id,
        username,
        roles = ['role-default'],
        online,
        isBot = false,
    }: {
        id: string;
        username: string;
        roles?: string[];
        online?: boolean;
        isBot?: boolean;
    }): ServerMember =>
        ({
            id: `m-${id}`,
            userId: id,
            serverId: 'srv-1',
            user: {
                id: id,
                username,
                isBot,
            } as User,
            roles,
            online,
            joinedAt: new Date().toISOString(),
        }) as ServerMember;

    beforeEach((): void => {
        vi.clearAllMocks();
        // Default: everyone is offline except 'me'
        (useMe as Mock).mockReturnValue({ data: mockMe });
        applySelectorState({}); // presenceMap and blocks are empty
    });

    it('ranks and groups members by separated roles and online status', (): void => {
        // Set u1, u2, u3 as online
        applySelectorState({
            presenceMap: {
                u1: { status: 'online' },
                u2: { status: 'online' },
                u3: { status: 'online' },
            },
        });

        render(
            <ServerSidebarSection
                isLoading={false}
                memberIconRoleMap={new Map()}
                memberRoleMap={memberRoleMap}
                members={mockMembers}
                roles={mockRoles}
                scrollRef={mockScrollRef as any}
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

    it('sorts members alphabetically within each group', (): void => {
        // Set all as online
        applySelectorState({
            presenceMap: {
                u1: { status: 'online' },
                u2: { status: 'online' },
                u3: { status: 'online' },
                u4: { status: 'online' },
            },
        });

        render(
            <ServerSidebarSection
                isLoading={false}
                memberIconRoleMap={new Map()}
                memberRoleMap={memberRoleMap}
                members={mockMembers}
                roles={mockRoles}
                scrollRef={mockScrollRef as any}
            />,
        );

        const adminItems = screen.getAllByTestId(/user-item-u[13]/);
        expect(adminItems[0].getAttribute('data-testid')).toBe('user-item-u1'); // Alice Display
        expect(adminItems[1].getAttribute('data-testid')).toBe('user-item-u3'); // Bob
    });

    it('moves a user to Offline group when they go offline', async (): Promise<void> => {
        // Initial state: u1 is online
        applySelectorState({
            presenceMap: {
                u1: { status: 'online' },
            },
        });

        const { rerender } = render(
            <ServerSidebarSection
                isLoading={false}
                memberIconRoleMap={new Map()}
                memberRoleMap={memberRoleMap}
                members={[mockMembers[0]]} // Only Alice
                roles={mockRoles}
                scrollRef={mockScrollRef as any}
            />,
        );

        expect(screen.getByText(/Admin - 1/)).toBeDefined();
        expect(screen.queryByText(/Offline/)).toBeNull();

        // Update presence: u1 goes offline
        applySelectorState({
            presenceMap: {
                u1: { status: 'offline' },
            },
        });

        rerender(
            <ServerSidebarSection
                isLoading={false}
                memberIconRoleMap={new Map()}
                memberRoleMap={memberRoleMap}
                members={[mockMembers[0]]}
                roles={mockRoles}
                scrollRef={mockScrollRef as any}
            />,
        );

        expect(screen.queryByText(/Admin/)).toBeNull();
        expect(screen.getByText(/Offline - 1/)).toBeDefined();
    });

    it('respects role separation permissions', (): void => {
        // Dave (u4) is online. His highest role "Member" is NOT separated.
        applySelectorState({
            presenceMap: {
                u4: { status: 'online' },
            },
        });

        render(
            <ServerSidebarSection
                isLoading={false}
                memberIconRoleMap={new Map()}
                memberRoleMap={memberRoleMap}
                members={[mockMembers[3]]}
                roles={mockRoles}
                scrollRef={mockScrollRef as any}
            />,
        );

        expect(screen.getByText(/Online - 1/)).toBeDefined();
        expect(screen.queryByText(/Member/)).toBeNull();
    });

    it('moves stale offline snapshots to Online group when presence turns online (regression)', (): void => {
        const members = [
            makeMember({ id: 'u10', username: 'Human', online: false }),
            makeMember({
                id: 'b10',
                username: 'HelperBot',
                online: false,
                isBot: true,
            }),
        ];

        applySelectorState({
            presenceMap: {
                u10: { status: 'offline' },
                b10: { status: 'offline' },
            },
        });
        const { rerender } = render(
            <ServerSidebarSection
                isLoading={false}
                memberIconRoleMap={new Map()}
                memberRoleMap={new Map()}
                members={members}
                roles={mockRoles}
                scrollRef={mockScrollRef as any}
            />,
        );

        expect(screen.getByText(/Offline - 2/)).toBeDefined();
        expect(screen.queryByText(/Online - 2/)).toBeNull();

        applySelectorState({
            presenceMap: {
                u10: { status: 'online' },
                b10: { status: 'online' },
            },
        });
        rerender(
            <ServerSidebarSection
                isLoading={false}
                memberIconRoleMap={new Map()}
                memberRoleMap={new Map()}
                members={members}
                roles={mockRoles}
                scrollRef={mockScrollRef as any}
            />,
        );

        expect(screen.queryByText(/Offline - 2/)).toBeNull();
        expect(screen.getByText(/Online - 2/)).toBeDefined();
    });

    it('moves stale online snapshots to Offline group when presence turns offline (regression)', (): void => {
        const member = makeMember({
            id: 'u20',
            username: 'AlwaysOnlineSnapshot',
            online: true,
        });

        applySelectorState({
            presenceMap: {
                u20: { status: 'online' },
            },
        });
        const { rerender } = render(
            <ServerSidebarSection
                isLoading={false}
                memberIconRoleMap={new Map()}
                memberRoleMap={new Map()}
                members={[member]}
                roles={mockRoles}
                scrollRef={mockScrollRef as any}
            />,
        );

        expect(screen.getByText(/Online - 1/)).toBeDefined();
        expect(screen.queryByText(/Offline - 1/)).toBeNull();

        applySelectorState({
            presenceMap: {
                u20: { status: 'offline' },
            },
        });
        rerender(
            <ServerSidebarSection
                isLoading={false}
                memberIconRoleMap={new Map()}
                memberRoleMap={new Map()}
                members={[member]}
                roles={mockRoles}
                scrollRef={mockScrollRef as any}
            />,
        );

        expect(screen.queryByText(/Online - 1/)).toBeNull();
        expect(screen.getByText(/Offline - 1/)).toBeDefined();
    });

    it.each([
        {
            caseName: 'uses presence when member.online is undefined',
            online: undefined,
            presenceStatus: 'online' as const,
            blocks: {} as Record<string, number>,
            expectedOnline: true,
        },
        {
            caseName:
                'uses live presence when member.online is false and presence is online',
            online: false,
            presenceStatus: 'online' as const,
            blocks: {} as Record<string, number>,
            expectedOnline: true,
        },
        {
            caseName:
                'uses live presence when member.online is true and presence is offline',
            online: true,
            presenceStatus: 'offline' as const,
            blocks: {} as Record<string, number>,
            expectedOnline: false,
        },
        {
            caseName: 'forceOffline overrides online signals',
            online: true,
            presenceStatus: 'online' as const,
            blocks: { u30: BlockFlags.HIDE_THEIR_PRESENCE },
            expectedOnline: false,
        },
    ])(
        '$caseName',
        ({ online, presenceStatus, blocks, expectedOnline }): void => {
            const member = makeMember({
                id: 'u30',
                username: 'MatrixUser',
                online,
            });

            applySelectorState({
                presenceMap: { u30: { status: presenceStatus } },
                blocks,
            });

            render(
                <ServerSidebarSection
                    isLoading={false}
                    memberIconRoleMap={new Map()}
                    memberRoleMap={new Map()}
                    members={[member]}
                    roles={mockRoles}
                    scrollRef={mockScrollRef as any}
                />,
            );

            if (expectedOnline) {
                expect(screen.getByText(/Online - 1/)).toBeDefined();
                expect(screen.queryByText(/Offline - 1/)).toBeNull();
            } else {
                expect(screen.getByText(/Offline - 1/)).toBeDefined();
                expect(screen.queryByText(/Online - 1/)).toBeNull();
            }
        },
    );

    it("does not show a different user's profile popup when a presence change reorders the list", (): void => {
        const alice = makeMember({ id: 'u-alice', username: 'alice' });
        const bob = makeMember({ id: 'u-bob', username: 'bob' });

        applySelectorState({
            presenceMap: {
                'u-alice': { status: 'online' },
                'u-bob': { status: 'online' },
            },
        });

        const { rerender } = render(
            <ServerSidebarSection
                isLoading={false}
                memberIconRoleMap={new Map()}
                memberRoleMap={new Map()}
                members={[alice, bob]}
                roles={[]}
                scrollRef={mockScrollRef as any}
            />,
        );

        fireEvent.click(screen.getByTestId('open-profile-u-alice'));
        expect(screen.getByTestId('profile-popup')).toHaveAttribute(
            'data-userid',
            'u-alice',
        );

        applySelectorState({
            presenceMap: {
                'u-alice': { status: 'offline' },
                'u-bob': { status: 'online' },
            },
        });
        rerender(
            <ServerSidebarSection
                isLoading={false}
                memberIconRoleMap={new Map()}
                memberRoleMap={new Map()}
                members={[alice, bob]}
                roles={[]}
                scrollRef={mockScrollRef as any}
            />,
        );

        const popup = screen.queryByTestId('profile-popup');
        expect(popup?.getAttribute('data-userid')).not.toBe('u-bob');
    });

    it('renders a static member list fallback when the virtualizer has not measured rows yet', (): void => {
        vi.mocked(useVirtualizer).mockReturnValueOnce({
            getVirtualItems: (): never[] => [],
            getTotalSize: (): number => 0,
            scrollToIndex: vi.fn(),
            measureElement: vi.fn(),
        } as never);

        render(
            <ServerSidebarSection
                isLoading={false}
                memberIconRoleMap={new Map()}
                memberRoleMap={new Map()}
                members={[mockMembers[0]]}
                roles={mockRoles}
                scrollRef={{ current: null }}
            />,
        );

        expect(screen.getByText(/Offline - 1/)).toBeInTheDocument();
        expect(screen.getByTestId('user-item-u1')).toBeInTheDocument();
    });
});
