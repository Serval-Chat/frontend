import type { ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@/api/users/users.types';
import type { ManualUserStatus } from '@/hooks/useSelfStatus';

import { UserItem } from './UserItem';

const dispatchMock = vi.fn();
const sendFriendRequestMock = vi.fn();
const navigateMock = vi.fn();
const friendsMock = vi.fn(() => ({ data: [] as { id: string }[] }));
const useSelfStatusMock = vi.fn(
    (): { status: ManualUserStatus; setStatus: () => void } => ({
        status: 'online',
        setStatus: vi.fn(),
    }),
);

vi.mock('@/hooks/useSelfStatus', async () => {
    const actual =
        await vi.importActual<typeof import('@/hooks/useSelfStatus')>(
            '@/hooks/useSelfStatus',
        );
    return {
        ...actual,
        useSelfStatus: () => useSelfStatusMock(),
    };
});

vi.mock('react-router-dom', () => ({
    useNavigate: () => navigateMock,
}));

vi.mock('@/api/blocks/blocks.queries', () => ({
    useBlocks: (): { data: never[] } => ({ data: [] }),
    useBlockProfiles: (): { data: never[] } => ({ data: [] }),
    useUpsertBlock: () => ({ mutate: vi.fn() }),
    useRemoveBlock: () => ({ mutate: vi.fn() }),
    useCreateBlockProfile: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/api/friends/friends.queries', () => ({
    useFriends: () => friendsMock(),
    useRemoveFriend: () => ({ mutate: vi.fn() }),
    useSendFriendRequest: () => ({ mutate: sendFriendRequestMock }),
    useTogglePinFriend: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useServers: (): { data: never[] } => ({ data: [] }),
    useAddRoleToMember: () => ({ mutate: vi.fn(), isPending: false }),
    useRemoveRoleFromMember: () => ({ mutate: vi.fn(), isPending: false }),
    useKickMember: () => ({ mutate: vi.fn() }),
    useBanMember: () => ({ mutate: vi.fn() }),
    useTimeoutMember: () => ({ mutate: vi.fn() }),
    useServerDetails: (): { data: null } => ({ data: null }),
    useMembers: (): { data: never[] } => ({ data: [] }),
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: (): { data: { id: string } } => ({ data: { id: 'me' } }),
    useUserById: (): { data: null } => ({ data: null }),
}));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        setQueryData: vi.fn(),
    }),
}));

vi.mock('@/store/hooks', () => ({
    useAppDispatch: () => dispatchMock,
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({
            voice: {
                activeVoiceChannelId: null,
                voiceParticipants: {},
                userVolumes: {},
                voiceUserStates: {},
            },
            presence: { users: {} },
            unread: { unreadDms: {} },
        }),
}));

vi.mock(
    '@/ui/components/profile/ProfilePopup',
    (): { ProfilePopup: () => null } => ({
        ProfilePopup: (): null => null,
    }),
);
vi.mock(
    '@/ui/components/profile/modals/BlockUserModal',
    (): { BlockUserModal: () => null } => ({
        BlockUserModal: (): null => null,
    }),
);
vi.mock(
    '@/ui/components/servers/modals/BanUserModal',
    (): { BanUserModal: () => null } => ({
        BanUserModal: (): null => null,
    }),
);
vi.mock(
    '@/ui/components/servers/modals/KickUserModal',
    (): { KickUserModal: () => null } => ({
        KickUserModal: (): null => null,
    }),
);

vi.mock('./ContextMenu', () => ({
    ContextMenu: ({
        children,
        items,
    }: {
        children: ReactNode;
        items: {
            label?: string;
            type?: string;
            onClick?: () => void;
        }[];
    }) => (
        <div>
            {children}
            <div data-testid="context-items">
                {items
                    .filter(
                        (i): string | false | undefined =>
                            i.type !== 'divider' && i.label,
                    )
                    .map((i) => (
                        <button
                            key={i.label}
                            tabIndex={0}
                            onClick={i.onClick}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ')
                                    i.onClick?.();
                            }}
                        >
                            {i.label}
                        </button>
                    ))}
            </div>
        </div>
    ),
}));

describe('UserItem', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
        useSelfStatusMock.mockReturnValue({
            status: 'online',
            setStatus: vi.fn(),
        });
    });

    it('renders a bot tag for bot users', (): void => {
        const botUser: User = {
            id: 'bot-1',
            username: 'helper-bot',
            isBot: true,
        } as User;

        render(<UserItem noFetch user={botUser} userId="bot-1" />);
        expect(screen.getByText('BOT')).toBeInTheDocument();
    });

    it('hides Add Friend action for bots while keeping it for humans', (): void => {
        const botUser: User = {
            id: 'bot-1',
            username: 'helper-bot',
            isBot: true,
        } as User;
        const humanUser: User = {
            id: 'user-2',
            username: 'alice',
            isBot: false,
        } as User;

        const { rerender } = render(
            <UserItem noFetch user={botUser} userId="bot-1" />,
        );
        expect(screen.queryByText('Add Friend')).not.toBeInTheDocument();

        rerender(<UserItem noFetch user={humanUser} userId="user-2" />);
        expect(screen.getByText('Add Friend')).toBeInTheDocument();
    });

    it('navigates to the DM route when "Open DMs" is clicked for a friend', (): void => {
        const friendUser: User = {
            id: 'user-2',
            username: 'alice',
            isBot: false,
        } as User;
        friendsMock.mockReturnValue({ data: [{ id: 'user-2' }] });

        render(<UserItem noFetch user={friendUser} userId="user-2" />);

        fireEvent.click(screen.getByText('Open DMs'));

        expect(navigateMock).toHaveBeenCalledWith('/chat/@user/user-2');
    });

    it('shows the current user as offline in a member list when they set their own status to offline/invisible, matching what others see', (): void => {
        useSelfStatusMock.mockReturnValue({
            status: 'offline',
            setStatus: vi.fn(),
        });
        const meUser: User = {
            id: 'me',
            username: 'me',
            isBot: false,
        } as User;

        render(<UserItem noFetch user={meUser} userId="me" />);

        expect(screen.getByTitle('Offline')).toBeInTheDocument();
        expect(screen.queryByTitle('Online')).not.toBeInTheDocument();
    });

    it('still shows a non-self user as offline based on their real presence', (): void => {
        const otherUser: User = {
            id: 'user-2',
            username: 'alice',
            isBot: false,
        } as User;

        render(<UserItem noFetch user={otherUser} userId="user-2" />);

        expect(screen.getByTitle('Offline')).toBeInTheDocument();
    });
});
