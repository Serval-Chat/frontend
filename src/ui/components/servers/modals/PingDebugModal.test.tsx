import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type { Channel } from '@/api/servers/servers.types';

import { PingDebugModal } from './PingDebugModal';

const fixtures = vi.hoisted(() => {
    const now = Date.now();
    return {
        mockState: {
            unread: {
                unreadServers: {
                    'srv-1': { hasUnread: true, pingCount: 4 },
                    'srv-2': { hasUnread: false, pingCount: 0 },
                },
                unreadDms: {},
            },
        },
        mockChannels: [
            {
                id: 'ch-1',
                name: 'general',
                serverId: 'srv-1',
                type: 'text',
                position: 0,
                lastMessageAt: new Date(now - 30_000).toISOString(),
                lastReadAt: new Date(now - 120_000).toISOString(),
            },
            {
                id: 'ch-2',
                name: 'art',
                serverId: 'srv-1',
                type: 'text',
                position: 1,
                lastMessageAt: new Date(now - 30_000).toISOString(),
                lastReadAt: new Date(now - 10_000).toISOString(),
            },
            {
                id: 'ch-3',
                name: 'never',
                serverId: 'srv-1',
                type: 'text',
                position: 2,
                lastMessageAt: new Date(now - 30_000).toISOString(),
                lastReadAt: null,
            },
            {
                id: 'ch-4',
                name: 'announcements',
                serverId: 'srv-1',
                type: 'link',
                position: 3,
                lastMessageAt: new Date(now - 30_000).toISOString(),
                lastReadAt: null,
            },
        ] as Channel[],
    };
});

const mention = (id: string, text: string) => ({
    id,
    type: 'mention' as const,
    sender: 'cat',
    senderId: '0265935371727011840',
    serverId: 'srv-1',
    channelId: 'ch-1',
    timestamp: Date.now(),
    message: {
        messageId: '0362009044010926081',
        text,
        createdAt: '2026-09-26T11:59:00.000Z',
    },
});

vi.mock('@/api/pings/pings.queries', () => ({
    usePings: () => ({
        data: {
            pings: [
                mention('0362009044010926080', 'first ping'),
                mention('0362009044010926081', 'second ping'),
                {
                    id: '9999999999999999999',
                    type: 'mention' as const,
                    sender: 'gorciu',
                    senderId: '0244871598790672384',
                    timestamp: Date.now(),
                    message: {
                        messageId: '0362009044010926082',
                        text: 'dm ping',
                        createdAt: '2026-09-26T11:59:00.000Z',
                    },
                },
            ],
        },
    }),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    SERVERS_QUERY_KEYS: {
        unread: (): readonly ['servers', 'unread'] =>
            ['servers', 'unread'] as const,
        channels: (
            serverId: string | null,
        ): readonly ['servers', 'channels', string | null] =>
            ['servers', 'channels', serverId] as const,
    },
    useChannels: () => ({ data: fixtures.mockChannels }),
}));

vi.mock('@/hooks/useConnectivity', () => ({
    useConnectivity: () => ({ status: 'online' }),
}));

vi.mock('@/store/hooks', () => ({
    useAppSelector: (selector: (state: unknown) => unknown): unknown =>
        selector(fixtures.mockState),
}));

const renderModal = (
    badgeCount: number,
    serverId = 'srv-1',
    isActive = false,
): QueryClient => {
    const queryClient = new QueryClient();
    queryClient.setQueryData(
        ['servers', 'unread'],
        fixtures.mockState.unread.unreadServers,
    );
    render(
        <QueryClientProvider client={queryClient}>
            <PingDebugModal
                isOpen
                badgeCount={badgeCount}
                isActive={isActive}
                serverId={serverId}
                serverName="My Server"
                onClose={(): void => {}}
            />
        </QueryClientProvider>,
    );
    return queryClient;
};

describe('PingDebugModal', () => {
    it('shows badge vs list counts, the mismatch warning, and only this servers rows', () => {
        renderModal(4);

        expect(
            screen.getByText('State (Debug): My Server'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(/Badge and list disagree \(4 vs 2\)/),
        ).toBeInTheDocument();
        expect(screen.getByText('0362009044010926080')).toBeInTheDocument();
        expect(screen.getByText('0362009044010926081')).toBeInTheDocument();
        expect(screen.queryByText('9999999999999999999')).toBeNull();
        expect(screen.getByText('first ping')).toBeInTheDocument();
    });

    it('explains the unread pill with per-channel last message and last read state', () => {
        renderModal(4);

        expect(screen.getAllByText('UNREAD')).toHaveLength(3);
        expect(screen.getByText('#general')).toBeInTheDocument();
        expect(screen.getByText('#never')).toBeInTheDocument();
        expect(screen.getByText('#art')).toBeInTheDocument();
        expect(screen.queryByText('#announcements')).toBeNull();
        expect(
            screen.getByText('pill tracks messages, pings track mentions only'),
        ).toBeInTheDocument();
        expect(screen.getByText('WS: online')).toBeInTheDocument();
        expect(screen.getByText(/last unread sync/)).toBeInTheDocument();
    });

    it('shows the read chip for a server without unread messages', () => {
        renderModal(0, 'srv-2');

        expect(screen.getByText('read')).toBeInTheDocument();
        expect(screen.queryAllByText('UNREAD')).toHaveLength(2);
    });

    it('notes that the list hides the pill and badge for the active server', () => {
        renderModal(4, 'srv-1', true);

        expect(screen.getByText(/hides this server/)).toBeInTheDocument();
    });

    it('copies the report as JSON to the clipboard, including the unread snapshot', () => {
        const writeText = vi.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            value: { writeText },
            configurable: true,
        });

        renderModal(2);

        fireEvent.click(screen.getByText('Copy JSON'));

        expect(writeText).toHaveBeenCalledTimes(1);
        const firstArg: unknown = writeText.mock.calls[0]?.[0];
        expect(typeof firstArg).toBe('string');
        const payload = JSON.parse(firstArg as string);
        expect(payload.serverId).toBe('srv-1');
        expect(payload.badgeCount).toBe(2);
        expect(payload.mismatch).toBe(false);
        expect(payload.rows).toHaveLength(2);
        expect(payload.unread.hasUnread).toBe(true);
        expect(payload.unread.pingCount).toBe(4);
        expect(payload.unread.connectivity).toBe('online');
        expect(payload.unread.channels).toHaveLength(3);
    });
});
