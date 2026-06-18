import type { ReactNode } from 'react';

import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@/api/users/users.types';

import { UserItem } from './UserItem';

const dispatchMock = vi.fn();
const sendFriendRequestMock = vi.fn();
const navigateMock = vi.fn();
const friendsMock = vi.fn(() => ({ data: [] as { id: string }[] }));

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
}));

vi.mock('@/api/servers/servers.queries', () => ({
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
        items: Array<{
            label?: string;
            type?: string;
            onClick?: () => void;
        }>;
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
                        <span
                            key={i.label}
                            role="button"
                            tabIndex={0}
                            onClick={i.onClick}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' || e.key === ' ')
                                    i.onClick?.();
                            }}
                        >
                            {i.label}
                        </span>
                    ))}
            </div>
        </div>
    ),
}));

describe('UserItem', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
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
});
