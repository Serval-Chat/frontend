import { render } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as UserQueries from '@/api/users/users.queries';
import { useAppSelector } from '@/store/hooks';

import { MainChat } from './MainChat';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('@/store/hooks', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@/hooks/chat/useFileQueue', () => ({
    useFileQueue: vi.fn().mockReturnValue({}),
}));

vi.mock('@/hooks/chat/useMemberMaps', () => ({
    useMemberMaps: vi.fn().mockReturnValue({}),
}));

vi.mock('@/hooks/chat/usePaginatedMessages', () => ({
    usePaginatedMessages: vi.fn().mockReturnValue({
        rawMessagesData: undefined,
        isLoading: false,
    }),
}));

vi.mock('@/hooks/chat/useProcessedMessages', () => ({
    useProcessedMessages: vi.fn().mockReturnValue([]),
}));

vi.mock('@/hooks/ws/useChatWS', () => ({
    useChatWS: vi.fn().mockReturnValue({ typingUsers: [] }),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useChannels: vi.fn().mockReturnValue({ data: [] }),
    useMembers: vi.fn().mockReturnValue({ data: [] }),
    useRoles: vi.fn().mockReturnValue({ data: [] }),
    useServerDetails: vi.fn().mockReturnValue({ data: undefined }),
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn().mockReturnValue({ data: undefined }),
    useUserById: vi.fn(),
}));

vi.mock('@/ui/components/chat/ChatHeader', () => ({
    ChatHeader: () => <div data-testid="chat-header" />,
}));
vi.mock('@/ui/components/chat/MessageInput', () => ({
    MessageInput: () => <div data-testid="message-input" />,
}));
vi.mock('@/ui/components/chat/MessagesList', () => ({
    MessagesList: () => <div data-testid="messages-list" />,
}));
vi.mock('@/ui/components/chat/TypingIndicator', () => ({
    TypingIndicator: () => <div data-testid="typing-indicator" />,
}));
vi.mock('@/ui/components/common/Text', () => ({
    Text: ({ children }: { children: React.ReactNode }) => (
        <span>{children}</span>
    ),
}));
vi.mock('@/ui/components/layout/Box', () => ({
    Box: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('MainChat fallback logic', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    });

    it('navigates to @me if the user query errors out (fake friend ID)', () => {
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            const state = {
                nav: { selectedFriendId: 'fakeUserId123' },
            };
            return selector(state as never);
        });

        vi.mocked(UserQueries.useUserById).mockReturnValue({
            data: undefined,
            isError: true,
        } as never);

        render(<MainChat />);

        expect(mockNavigate).toHaveBeenCalledWith('/chat/@me', {
            replace: true,
        });
    });

    it('stays on the page if friendUser finishes loading successfully', () => {
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            const state = {
                nav: { selectedFriendId: 'validUserId123' },
            };
            return selector(state as never);
        });

        vi.mocked(UserQueries.useUserById).mockReturnValue({
            data: { _id: 'validUserId123', username: 'RealFriend' },
            isError: false,
        } as never);

        render(<MainChat />);

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
