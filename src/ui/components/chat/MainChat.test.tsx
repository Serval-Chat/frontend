import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    useClearChannelPings,
    useDeletePing,
    usePings,
} from '@/api/pings/pings.queries';
import { useMe, useUserById } from '@/api/users/users.queries';
import { useFileQueue } from '@/hooks/chat/useFileQueue';
import * as Permissions from '@/hooks/usePermissions';
import { useAppSelector } from '@/store/hooks';

import { MainChat } from './MainChat';

vi.mock('@/providers/ThemeProvider', () => ({
    useTheme: vi.fn().mockReturnValue({ theme: 'dark', setTheme: vi.fn() }),
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
    useLocation: vi.fn().mockReturnValue({ pathname: '/chat/@server/server1' }),
    useParams: vi.fn().mockReturnValue({ serverId: 'server1' }),
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
        channelPins: (
            id: string | null,
        ): readonly ['chat', 'pins', string | null] =>
            ['chat', 'pins', id] as const,
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
        hasPermission: (): boolean => true,
        permissions: {},
        isOwner: false,
        isLoading: false,
        isTimedOut: false,
        remainingTimeoutMs: 0,
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
    Box: ({
        children,
        ...props
    }: { children: React.ReactNode } & Record<string, unknown>) => (
        <div {...props}>{children}</div>
    ),
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

describe('channel send permission gating', (): void => {
    const mockNavigate = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            const state = {
                nav: { selectedServerId: 'server1', selectedChannelId: 'ch1' },
                furTweaker: {},
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

    it('shows the disabled notice and hides input when sendMessages is false', (): void => {
        vi.mocked(Permissions.usePermissions).mockReturnValue({
            hasPermission: (): false => false,
            permissions: {} as never,
            isOwner: false,
            isLoading: false,
            isTimedOut: false,
            remainingTimeoutMs: 0,
        });

        const { getByText, queryByTestId } = render(
            <QueryClientProvider client={queryClient}>
                <MainChat />
            </QueryClientProvider>,
        );

        expect(getByText("You can't type in this channel.")).toBeDefined();
        expect(queryByTestId('message-input')).toBeNull();
    });

    it('shows the message input when sendMessages is true', (): void => {
        vi.mocked(Permissions.usePermissions).mockReturnValue({
            hasPermission: (): true => true,
            permissions: {} as never,
            isOwner: false,
            isLoading: false,
            isTimedOut: false,
            remainingTimeoutMs: 0,
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

describe('MainChat fallback logic', (): void => {
    const mockNavigate = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
    });

    it('navigates to @me if the user query errors out (fake friend ID)', (): void => {
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            const state = {
                nav: { selectedFriendId: 'fakeUserId123' },
                furTweaker: {},
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

    it('stays on the page if friendUser finishes loading successfully', (): void => {
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            const state = {
                nav: { selectedFriendId: 'validUserId123' },
                furTweaker: {},
            };
            return selector(state as never);
        });

        vi.mocked(useUserById).mockReturnValue({
            data: { id: 'validUserId123', username: 'RealFriend' },
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

describe('drag and drop file detection', (): void => {
    const mockNavigate = vi.fn();
    const addFiles = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            const state = {
                nav: { selectedServerId: 'server1', selectedChannelId: 'ch1' },
                furTweaker: {},
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
        vi.mocked(Permissions.usePermissions).mockReturnValue({
            hasPermission: (): true => true,
            permissions: {} as never,
            isOwner: false,
            isLoading: false,
            isTimedOut: false,
            remainingTimeoutMs: 0,
        });
        vi.mocked(useFileQueue).mockReturnValue({ addFiles } as never);
    });

    const renderChat = (): HTMLElement => {
        const { container } = render(
            <QueryClientProvider client={queryClient}>
                <MainChat />
            </QueryClientProvider>,
        );
        const dropzone = container.querySelector('.chat-background');
        if (!dropzone) throw new Error('drop zone not found');
        return dropzone as HTMLElement;
    };

    it('does not show the file-upload overlay when plain text (e.g. a dragged server name) is dragged over the chat area', (): void => {
        const dropzone = renderChat();

        fireEvent.dragOver(dropzone, {
            dataTransfer: { types: ['text/plain'], files: [] },
        });

        expect(screen.queryByText('Drop files to upload')).toBeNull();
    });

    it('still shows the file-upload overlay when an actual file is dragged over the chat area', (): void => {
        const dropzone = renderChat();

        fireEvent.dragOver(dropzone, {
            dataTransfer: { types: ['Files'], files: [] },
        });

        expect(screen.getByText('Drop files to upload')).toBeDefined();
    });

    it('does not queue anything when a plain text drag is dropped on the chat area', (): void => {
        const dropzone = renderChat();

        fireEvent.drop(dropzone, {
            dataTransfer: { types: ['text/plain'], files: [] },
        });

        expect(addFiles).not.toHaveBeenCalled();
    });
});
