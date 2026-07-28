import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { MessageEdit } from './MessageEdit';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

vi.mock('@/api/chat/chat.queries', () => ({
    useEditChannelMessage: () => ({ mutate: vi.fn(), isPending: false }),
    useEditUserMessage: () => ({ mutate: vi.fn(), isPending: false }),
}));

vi.mock('@/api/friends/friends.queries', () => ({
    useFriends: () => ({ data: [] }),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useChannels: () => ({ data: [] }),
    useMembers: () => ({ data: [] }),
    useRoles: () => ({ data: [] }),
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: () => ({ data: { id: 'me123', settings: {} } }),
}));

vi.mock('@/hooks/useCustomEmojis', () => ({
    useCustomEmojis: () => ({ customCategories: [] }),
}));

vi.mock('@/hooks/useFrequentlyUsedEmojis', () => ({
    useFrequentlyUsedEmojis: () => ({
        quickReactions: [],
        frequentlyUsedCategory: null,
        recordUsage: vi.fn(),
    }),
}));

vi.mock('@/keybinds/useKeybindManager', () => ({
    useKeybindManager: () => ({
        matches: vi.fn(),
    }),
}));

vi.mock('@/store/hooks', () => ({
    useAppSelector: vi.fn(() => ({})),
    useAppDispatch: vi.fn(() => vi.fn()),
}));

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

describe('MessageEdit', () => {
    it('focuses the input field automatically when mounted', async () => {
        render(
            <QueryClientProvider client={queryClient}>
                <MessageEdit
                    channelId="chan1"
                    initialText="Hello world"
                    messageId="msg1"
                    serverId="srv1"
                    onCancel={() => {}}
                />
            </QueryClientProvider>
        );

        const contentEditable = await screen.findByRole('textbox');
        
        await waitFor(() => {
            expect(document.activeElement).toBe(contentEditable);
        });
    });
});
