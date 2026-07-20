import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { FriendRequest } from '@/api/friends/friends.types';
import type { User } from '@/api/users/users.types';

import { UserProfileCard } from './UserProfileCard';

const meMock = vi.fn(() => ({ data: { id: 'user-a' } }));
const friendsMock = vi.fn(() => ({ data: [] as { id: string }[] }));
const incomingRequestsMock = vi.fn(() => ({ data: [] as FriendRequest[] }));
const outgoingRequestsMock = vi.fn(() => ({ data: [] as FriendRequest[] }));
const sendFriendRequestMock = vi.fn();
const acceptFriendRequestMock = vi.fn();
const cancelFriendRequestMock = vi.fn();
const removeFriendMock = vi.fn();

vi.mock('react-router-dom', () => ({
    useNavigate: () => vi.fn(),
}));

vi.mock('@/api/friends/friends.queries', () => ({
    useFriends: () => friendsMock(),
    useIncomingRequests: () => incomingRequestsMock(),
    useOutgoingRequests: () => outgoingRequestsMock(),
    useSendFriendRequest: () => ({ mutate: sendFriendRequestMock }),
    useRemoveFriend: () => ({ mutate: removeFriendMock }),
    useAcceptFriendRequest: () => ({ mutate: acceptFriendRequestMock }),
    useCancelFriendRequest: () => ({ mutate: cancelFriendRequestMock }),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useAddRoleToMember: () => ({ mutate: vi.fn() }),
    useRemoveRoleFromMember: () => ({ mutate: vi.fn() }),
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: () => meMock(),
}));

vi.mock('@tanstack/react-query', () => ({
    useQueryClient: () => ({
        setQueryData: vi.fn(),
    }),
}));

vi.mock('@/store/hooks', () => ({
    useAppDispatch: () => vi.fn(),
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({
            presence: { users: {} },
        }),
}));

describe('UserProfileCard friend request action', (): void => {
    // Viewing user B's profile as user A.
    const userB: User = {
        id: 'user-b',
        username: 'userb',
        displayName: 'User B',
    } as User;

    beforeEach((): void => {
        vi.clearAllMocks();
        meMock.mockReturnValue({ data: { id: 'user-a' } });
        friendsMock.mockReturnValue({ data: [] });
        incomingRequestsMock.mockReturnValue({ data: [] });
        outgoingRequestsMock.mockReturnValue({ data: [] });
    });

    it('shows "Send Friend Request" when there is no existing relationship', (): void => {
        render(<UserProfileCard user={userB} />);

        expect(screen.getByText('Send Friend Request')).toBeInTheDocument();
        expect(
            screen.queryByText('Accept Friend Request'),
        ).not.toBeInTheDocument();
    });

    it('shows "Accept Friend Request" instead of "Send Friend Request" when the viewed user already sent me a friend request', (): void => {
        incomingRequestsMock.mockReturnValue({
            data: [
                {
                    id: 'request-1',
                    fromId: 'user-b',
                    toId: 'user-a',
                    createdAt: new Date().toISOString(),
                },
            ],
        });

        render(<UserProfileCard user={userB} />);

        expect(screen.getByText('Accept Friend Request')).toBeInTheDocument();
        expect(
            screen.queryByText('Send Friend Request'),
        ).not.toBeInTheDocument();
    });

    it('accepts the incoming request when "Accept Friend Request" is clicked', (): void => {
        incomingRequestsMock.mockReturnValue({
            data: [
                {
                    id: 'request-1',
                    fromId: 'user-b',
                    toId: 'user-a',
                    createdAt: new Date().toISOString(),
                },
            ],
        });

        render(<UserProfileCard user={userB} />);

        screen.getByText('Accept Friend Request').click();

        expect(acceptFriendRequestMock).toHaveBeenCalledWith('request-1');
    });

    it('switches to "Cancel Friend Request" once a request has been sent, so the click has visible feedback', (): void => {
        const { rerender } = render(<UserProfileCard user={userB} />);

        expect(screen.getByText('Send Friend Request')).toBeInTheDocument();

        screen.getByText('Send Friend Request').click();
        expect(sendFriendRequestMock).toHaveBeenCalledWith('userb');

        // Simulates the cache update `useSendFriendRequest` performs on
        // success: the outgoing-requests query now includes this request.
        outgoingRequestsMock.mockReturnValue({
            data: [
                {
                    id: 'request-2',
                    fromId: 'user-a',
                    toId: 'user-b',
                    createdAt: new Date().toISOString(),
                },
            ],
        });
        rerender(<UserProfileCard user={userB} />);

        expect(
            screen.getByText('Cancel Friend Request'),
        ).toBeInTheDocument();
        expect(
            screen.queryByText('Send Friend Request'),
        ).not.toBeInTheDocument();
    });

    it('cancels the outgoing request when "Cancel Friend Request" is clicked', (): void => {
        outgoingRequestsMock.mockReturnValue({
            data: [
                {
                    id: 'request-2',
                    fromId: 'user-a',
                    toId: 'user-b',
                    createdAt: new Date().toISOString(),
                },
            ],
        });

        render(<UserProfileCard user={userB} />);

        screen.getByText('Cancel Friend Request').click();

        expect(cancelFriendRequestMock).toHaveBeenCalledWith('request-2');
    });

    it('hides the "Message" action when the viewed user is not a friend, since DMs are only readable between friends', (): void => {
        render(<UserProfileCard user={userB} />);

        expect(screen.queryByText('Message')).not.toBeInTheDocument();
    });

    it('hides the "Message" action for an incoming request too, since accepting is required before DMs work', (): void => {
        incomingRequestsMock.mockReturnValue({
            data: [
                {
                    id: 'request-1',
                    fromId: 'user-b',
                    toId: 'user-a',
                    createdAt: new Date().toISOString(),
                },
            ],
        });

        render(<UserProfileCard user={userB} />);

        expect(screen.queryByText('Message')).not.toBeInTheDocument();
    });

    it('shows the "Message" action once the viewed user is a friend', (): void => {
        friendsMock.mockReturnValue({ data: [{ id: 'user-b' }] });

        render(<UserProfileCard user={userB} />);

        expect(screen.getByText('Message')).toBeInTheDocument();
    });
});

describe('UserProfileCard admin "Complete Profile View" data', (): void => {
    const adminViewedUser: User = {
        id: 'user-c',
        username: 'cat',
        displayName: 'Catflare',
        decorationId: 'decoration-1',
        profilePrimaryColor: '#000000',
        profileAccentColor: '#ff0000',
        bannerColor: '#e66100',
        customStatus: {
            text: 'I love Serchat',
            expiresAt: null,
            updatedAt: new Date(),
        },
        connections: [
            {
                id: 'conn-1',
                type: 'Website',
                value: 'ser.chat',
                status: 'verified',
            },
        ],
        isPrivate: true,
        privacySettings: {
            privateProfile: true,
            hideDisplayName: true,
            hidePronouns: true,
            hideConnections: true,
            hideBio: true,
            hideStatus: true,
        },
    } as User;

    beforeEach((): void => {
        vi.clearAllMocks();
        meMock.mockReturnValue({ data: { id: 'user-a' } });
        friendsMock.mockReturnValue({ data: [] });
        incomingRequestsMock.mockReturnValue({ data: [] });
        outgoingRequestsMock.mockReturnValue({ data: [] });

        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockImplementation((query: string) => ({
                matches: false,
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })),
        );
    });

    it('renders the custom status, verified connections, decoration and profile colors, hides friend actions, and does not show the "may be hidden" badge since the payload already includes full privacySettings', (): void => {
        const { container } = render(
            <UserProfileCard hideActions user={adminViewedUser} />,
        );

        expect(
            screen.queryByText('Send Friend Request'),
        ).not.toBeInTheDocument();
        expect(screen.queryByText('Message')).not.toBeInTheDocument();

        expect(screen.getByText('I love Serchat')).toBeInTheDocument();
        expect(screen.getByText('ser.chat')).toBeInTheDocument();

        expect(
            container.querySelector('img[src*="decoration-1"]'),
        ).not.toBeNull();

        const card = container.querySelector('.relative.isolate');
        expect(card?.getAttribute('style')).toContain('#000000');

        expect(
            container.querySelector('[class*="bg-black/50"]'),
        ).toBeNull();
    });

    it('shows the "may be hidden" privacy badge for a restricted view where the backend withheld privacySettings entirely', (): void => {
        const restrictedView: User = {
            id: 'user-e',
            username: 'private-cat',
            isPrivate: true,
        } as User;

        const { container } = render(
            <UserProfileCard hideActions user={restrictedView} />,
        );

        expect(
            container.querySelector('[class*="bg-black/50"]'),
        ).not.toBeNull();
    });

    it('shows the third-person "User made this field private to others" hint (not "You made this field private") when viewing someone else\'s hidden field', async (): Promise<void> => {
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockImplementation((query: string) => ({
                matches: true,
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })),
        );

        const userWithHiddenBio: User = {
            id: 'user-d',
            username: 'catd',
            bio: 'hidden bio text',
            isPrivate: false,
            privacySettings: {
                privateProfile: false,
                hideDisplayName: false,
                hidePronouns: false,
                hideConnections: false,
                hideBio: true,
                hideStatus: false,
            },
        } as User;

        const { container } = render(
            <UserProfileCard hideActions user={userWithHiddenBio} />,
        );

        const trigger = container
            .querySelector('.ml-1.shrink-0')
            ?.closest('div');
        expect(trigger).not.toBeNull();
        fireEvent.mouseEnter(trigger as HTMLElement);

        await waitFor(() => {
            expect(
                screen.getByText('User made this field private to others'),
            ).toBeInTheDocument();
        });
        expect(
            screen.queryByText('You made this field private'),
        ).not.toBeInTheDocument();
    });

    it('shows the first-person "You made this field private" hint when viewing your own hidden field', async (): Promise<void> => {
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockImplementation((query: string) => ({
                matches: true,
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })),
        );
        meMock.mockReturnValue({ data: { id: 'user-d' } });

        const ownUserWithHiddenBio: User = {
            id: 'user-d',
            username: 'catd',
            bio: 'hidden bio text',
            isPrivate: false,
            privacySettings: {
                privateProfile: false,
                hideDisplayName: false,
                hidePronouns: false,
                hideConnections: false,
                hideBio: true,
                hideStatus: false,
            },
        } as User;

        const { container } = render(
            <UserProfileCard hideActions user={ownUserWithHiddenBio} />,
        );

        const trigger = container
            .querySelector('.ml-1.shrink-0')
            ?.closest('div');
        expect(trigger).not.toBeNull();
        fireEvent.mouseEnter(trigger as HTMLElement);

        await waitFor(() => {
            expect(
                screen.getByText('You made this field private'),
            ).toBeInTheDocument();
        });
        expect(
            screen.queryByText('User made this field private to others'),
        ).not.toBeInTheDocument();
    });

    it('shows the third-person hint even for your own account when adminView is set, since the admin panel is an inspection tool, not your settings page', async (): Promise<void> => {
        vi.stubGlobal(
            'matchMedia',
            vi.fn().mockImplementation((query: string) => ({
                matches: true,
                media: query,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })),
        );
        meMock.mockReturnValue({ data: { id: 'user-d' } });

        const ownUserWithHiddenBio: User = {
            id: 'user-d',
            username: 'catd',
            bio: 'hidden bio text',
            isPrivate: false,
            privacySettings: {
                privateProfile: false,
                hideDisplayName: false,
                hidePronouns: false,
                hideConnections: false,
                hideBio: true,
                hideStatus: false,
            },
        } as User;

        const { container } = render(
            <UserProfileCard
                adminView
                hideActions
                user={ownUserWithHiddenBio}
            />,
        );

        const trigger = container
            .querySelector('.ml-1.shrink-0')
            ?.closest('div');
        expect(trigger).not.toBeNull();
        fireEvent.mouseEnter(trigger as HTMLElement);

        await waitFor(() => {
            expect(
                screen.getByText('User made this field private to others'),
            ).toBeInTheDocument();
        });
        expect(
            screen.queryByText('You made this field private'),
        ).not.toBeInTheDocument();
    });
});
