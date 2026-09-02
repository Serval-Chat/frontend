import { renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as ServerQueries from '@/api/servers/servers.queries';
import { useCustomEmojis } from '@/hooks/useCustomEmojis';
import * as UsePermissions from '@/hooks/usePermissions';

vi.mock('@/api/servers/servers.queries', () => ({
    useServers: vi.fn(),
    useAllServerEmojis: vi.fn(),
}));

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: vi.fn(),
}));

const mockServers = [
    { id: 'server1', name: 'Server One', icon: undefined },
    { id: 'server2', name: 'Server Two', icon: undefined },
];

const mockEmojis = [
    { id: 'e1', name: 'wave', imageUrl: '/e1.png', serverId: 'server1' },
    { id: 'e2', name: 'party', imageUrl: '/e2.png', serverId: 'server2' },
];

describe('useCustomEmojis', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(ServerQueries.useServers).mockReturnValue({
            data: mockServers,
        } as never);
        vi.mocked(ServerQueries.useAllServerEmojis).mockReturnValue({
            data: mockEmojis,
            isLoading: false,
        } as never);
    });

    it('returns every server category when no serverId is passed (legacy callers)', (): void => {
        vi.mocked(UsePermissions.usePermissions).mockReturnValue({
            hasPermission: vi.fn().mockReturnValue(false),
        } as never);

        const { result } = renderHook(() => useCustomEmojis());

        expect(result.current.customCategories.map((c) => c.id)).toEqual([
            'server1',
            'server2',
        ]);
        expect(result.current.hasExternalEmojiPermission).toBe(true);
    });

    it('returns every server category when the permission is granted', (): void => {
        vi.mocked(UsePermissions.usePermissions).mockReturnValue({
            hasPermission: vi.fn().mockReturnValue(true),
        } as never);

        const { result } = renderHook(() =>
            useCustomEmojis({ serverId: 'server1', channelId: 'channel1' }),
        );

        expect(result.current.customCategories.map((c) => c.id)).toEqual([
            'server1',
            'server2',
        ]);
        expect(result.current.hasExternalEmojiPermission).toBe(true);
    });

    it('only returns the current server category when the permission is denied', (): void => {
        vi.mocked(UsePermissions.usePermissions).mockReturnValue({
            hasPermission: vi.fn().mockReturnValue(false),
        } as never);

        const { result } = renderHook(() =>
            useCustomEmojis({ serverId: 'server1', channelId: 'channel1' }),
        );

        expect(result.current.customCategories.map((c) => c.id)).toEqual([
            'server1',
        ]);
        expect(result.current.hasExternalEmojiPermission).toBe(false);
    });
});
