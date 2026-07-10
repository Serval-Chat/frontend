import { render, screen } from '@testing-library/react';
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

vi.mock('@/store/hooks', () => ({
    useAppSelector: (selector: (state: unknown) => unknown) =>
        selector({ presence: { users: {} } }),
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
