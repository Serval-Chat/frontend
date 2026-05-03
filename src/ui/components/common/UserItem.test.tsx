import type { ReactNode } from 'react';

import { render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { User } from '@/api/users/users.types';

import { UserItem } from './UserItem';

const dispatchMock = vi.fn();
const sendFriendRequestMock = vi.fn();

vi.mock('@/api/blocks/blocks.queries', () => ({
    useBlocks: () => ({ data: [] }),
    useBlockProfiles: () => ({ data: [] }),
    useUpsertBlock: () => ({ mutate: vi.fn() }),
    useRemoveBlock: () => ({ mutate: vi.fn() }),
    useCreateBlockProfile: () => ({ mutateAsync: vi.fn() }),
}));

vi.mock('@/api/friends/friends.queries', () => ({
    useFriends: () => ({ data: [] }),
    useRemoveFriend: () => ({ mutate: vi.fn() }),
    useSendFriendRequest: () => ({ mutate: sendFriendRequestMock }),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useAddRoleToMember: () => ({ mutate: vi.fn(), isPending: false }),
    useRemoveRoleFromMember: () => ({ mutate: vi.fn(), isPending: false }),
    useKickMember: () => ({ mutate: vi.fn() }),
    useBanMember: () => ({ mutate: vi.fn() }),
    useTimeoutMember: () => ({ mutate: vi.fn() }),
    useServerDetails: () => ({ data: null }),
    useMembers: () => ({ data: [] }),
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: () => ({ data: { _id: 'me' } }),
    useUserById: () => ({ data: null }),
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
        }),
}));

vi.mock('@/ui/components/profile/ProfilePopup', () => ({
    ProfilePopup: () => null,
}));
vi.mock('@/ui/components/profile/modals/BlockUserModal', () => ({
    BlockUserModal: () => null,
}));
vi.mock('@/ui/components/servers/modals/BanUserModal', () => ({
    BanUserModal: () => null,
}));
vi.mock('@/ui/components/servers/modals/KickUserModal', () => ({
    KickUserModal: () => null,
}));

vi.mock('./ContextMenu', () => ({
    ContextMenu: ({
        children,
        items,
    }: {
        children: ReactNode;
        items: Array<{ label?: string; type?: string }>;
    }) => (
        <div>
            {children}
            <div data-testid="context-items">
                {items
                    .filter((i) => i.type !== 'divider' && i.label)
                    .map((i) => (
                        <span key={i.label}>{i.label}</span>
                    ))}
            </div>
        </div>
    ),
}));

describe('UserItem', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('renders a bot tag for bot users', () => {
        const botUser: User = {
            _id: 'bot-1',
            username: 'helper-bot',
            isBot: true,
        } as User;

        render(<UserItem noFetch user={botUser} userId="bot-1" />);
        expect(screen.getByText('BOT')).toBeInTheDocument();
    });

    it('hides Add Friend action for bots while keeping it for humans', () => {
        const botUser: User = {
            _id: 'bot-1',
            username: 'helper-bot',
            isBot: true,
        } as User;
        const humanUser: User = {
            _id: 'user-2',
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
});
