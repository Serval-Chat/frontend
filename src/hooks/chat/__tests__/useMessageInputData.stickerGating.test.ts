import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as ChatQueries from '@/api/chat/chat.queries';
import * as FriendsQueries from '@/api/friends/friends.queries';
import * as InteractionsQueries from '@/api/interactions/interactions.queries';
import * as ServerQueries from '@/api/servers/servers.queries';
import { useMessageInputData } from '@/hooks/chat/useMessageInputData';
import * as UseCustomEmojis from '@/hooks/useCustomEmojis';

vi.mock('react-router-dom', () => ({
    useLocation: vi
        .fn()
        .mockReturnValue({ pathname: '/chat/@server/server1/channel1' }),
}));

vi.mock('@/api/chat/chat.queries', () => ({
    useChannelMessages: vi.fn().mockReturnValue({ data: undefined }),
    useUserMessages: vi.fn().mockReturnValue({ data: undefined }),
    useEditChannelMessage: vi.fn().mockReturnValue({}),
    useEditUserMessage: vi.fn().mockReturnValue({}),
}));

vi.mock('@/api/friends/friends.queries', () => ({
    useFriends: vi.fn().mockReturnValue({ data: [] }),
}));

vi.mock('@/api/interactions/interactions.queries', () => ({
    useServerCommands: vi.fn().mockReturnValue({ data: [] }),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useMembers: vi.fn().mockReturnValue({ data: [] }),
    useRoles: vi.fn().mockReturnValue({ data: [] }),
    useChannels: vi.fn().mockReturnValue({ data: [] }),
    useServerDetails: vi
        .fn()
        .mockReturnValue({ data: { id: 'server1', name: 'Server One' } }),
    useServers: vi.fn().mockReturnValue({
        data: [
            { id: 'server1', name: 'Server One' },
            { id: 'server2', name: 'Server Two' },
        ],
    }),
    useServerStickers: vi.fn().mockReturnValue({
        data: [{ id: 's1', name: 'yay', serverId: 'server1' }],
    }),
    useAllStickers: vi.fn().mockReturnValue({
        data: [
            { id: 's1', name: 'yay', serverId: 'server1' },
            { id: 's2', name: 'boo', serverId: 'server2' },
        ],
    }),
}));

vi.mock('@/hooks/useCustomEmojis', () => ({
    useCustomEmojis: vi.fn(),
}));

const baseArgs = {
    selectedFriendId: null,
    selectedServerId: 'server1',
    selectedChannelId: 'channel1',
    me: { id: 'user1' } as never,
    showStickerPicker: true,
};

describe('useMessageInputData sticker gating', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(ChatQueries.useChannelMessages).mockReturnValue({
            data: undefined,
        } as never);
        vi.mocked(ChatQueries.useUserMessages).mockReturnValue({
            data: undefined,
        } as never);
        vi.mocked(FriendsQueries.useFriends).mockReturnValue({
            data: [],
        } as never);
        vi.mocked(InteractionsQueries.useServerCommands).mockReturnValue({
            data: [],
        } as never);
        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: { id: 'server1', name: 'Server One' },
        } as never);
        vi.mocked(ServerQueries.useServers).mockReturnValue({
            data: [
                { id: 'server1', name: 'Server One' },
                { id: 'server2', name: 'Server Two' },
            ],
        } as never);
        vi.mocked(ServerQueries.useServerStickers).mockReturnValue({
            data: [{ id: 's1', name: 'yay', serverId: 'server1' }],
        } as never);
        vi.mocked(ServerQueries.useAllStickers).mockReturnValue({
            data: [
                { id: 's1', name: 'yay', serverId: 'server1' },
                { id: 's2', name: 'boo', serverId: 'server2' },
            ],
        } as never);
    });

    it('includes other-server stickers when the permission is granted', (): void => {
        vi.mocked(UseCustomEmojis.useCustomEmojis).mockReturnValue({
            customCategories: [],
            isLoading: false,
            hasExternalEmojiPermission: true,
        });

        const { result } = renderHook(() => useMessageInputData(baseArgs));

        expect(
            result.current.stickerCategories.map((c) => c.id),
        ).toEqual(['server1', 'server2']);
    });

    it('only includes the current server sticker category when the permission is denied', (): void => {
        vi.mocked(UseCustomEmojis.useCustomEmojis).mockReturnValue({
            customCategories: [],
            isLoading: false,
            hasExternalEmojiPermission: false,
        });

        const { result } = renderHook(() => useMessageInputData(baseArgs));

        expect(
            result.current.stickerCategories.map((c) => c.id),
        ).toEqual(['server1']);
    });
});
