import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    useClearChannelPings,
    useDeletePing,
    usePings,
} from '@/api/pings/pings.queries';
import { useMe, useUserById } from '@/api/users/users.queries';
import * as Permissions from '@/hooks/usePermissions';
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

vi.mock('@/api/chat/chat.queries', () => ({
    usePinnedMessages: vi.fn().mockReturnValue({ data: [], isLoading: false }),
    CHAT_QUERY_KEYS: {
        channelPins: (id: string | null) => ['chat', 'pins', id] as const,
    },
}));

vi.mock('@/api/pings/pings.queries', () => ({
    usePings: vi.fn().mockReturnValue({ data: { pings: [] } }),
    useClearChannelPings: vi.fn().mockReturnValue({ mutate: vi.fn() }),
    useDeletePing: vi.fn().mockReturnValue({ mutate: vi.fn() }),
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn().mockReturnValue({ data: undefined }),
    useUserById: vi.fn(),
}));

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: vi.fn().mockReturnValue({
        hasPermission: () => true,
        permissions: {},
        isOwner: false,
        isLoading: false,
    }),
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

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

describe('channel send permission gating', () => {
    const mockNavigate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            const state = {
                nav: { selectedServerId: 'server1', selectedChannelId: 'ch1' },
            };
            return selector(state as never);
        });
        vi.mocked(useMe).mockReturnValue({ data: undefined } as never);
        vi.mocked(useUserById).mockReturnValue({
            data: undefined,
            isError: false,
        } as never);
        vi.mocked(usePings).mockReturnValue({
            data: { pings: [] },
        } as never);
        vi.mocked(useClearChannelPings).mockReturnValue({
            mutate: vi.fn(),
        } as never);
        vi.mocked(useDeletePing).mockReturnValue({
            mutate: vi.fn(),
        } as never);
    });

    it('shows the disabled notice and hides input when sendMessages is false', () => {
        vi.mocked(Permissions.usePermissions).mockReturnValue({
            hasPermission: () => false,
            permissions: {} as never,
            isOwner: false,
            isLoading: false,
        });

        const { getByText, queryByTestId } = render(
            <QueryClientProvider client={queryClient}>
                <MainChat />
            </QueryClientProvider>,
        );

        expect(getByText("You can't type in this channel.")).toBeDefined();
        expect(queryByTestId('message-input')).toBeNull();
    });

    it('shows the message input when sendMessages is true', () => {
        vi.mocked(Permissions.usePermissions).mockReturnValue({
            hasPermission: () => true,
            permissions: {} as never,
            isOwner: false,
            isLoading: false,
        });

        const { getByTestId, queryByText } = render(
            <QueryClientProvider client={queryClient}>
                <MainChat />
            </QueryClientProvider>,
        );

        expect(getByTestId('message-input')).toBeDefined();
        expect(queryByText("You can't type in this channel.")).toBeNull();
    });
});

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

        vi.mocked(useUserById).mockReturnValue({
            data: undefined,
            isError: true,
        } as never);

        render(
            <QueryClientProvider client={queryClient}>
                <MainChat />
            </QueryClientProvider>,
        );

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

        vi.mocked(useUserById).mockReturnValue({
            data: { _id: 'validUserId123', username: 'RealFriend' },
            isError: false,
        } as never);

        render(
            <QueryClientProvider client={queryClient}>
                <MainChat />
            </QueryClientProvider>,
        );

        expect(mockNavigate).not.toHaveBeenCalled();
    });
});
