import { act } from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import type * as FramerMotion from 'framer-motion';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { serversApi } from '@/api/servers/servers.api';
import type { Category, Channel } from '@/api/servers/servers.types';
import * as Permissions from '@/hooks/usePermissions';
import { useAppSelector } from '@/store/hooks';

import { ChannelList } from './ChannelList';

vi.mock('@/store/hooks', () => ({
    useAppDispatch: vi.fn().mockReturnValue(vi.fn()),
    useAppSelector: vi.fn(),
}));

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: vi.fn(),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useServerDetails: vi.fn().mockReturnValue({ data: undefined }),
    useVoiceStates: vi.fn(),
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn().mockReturnValue({ data: { id: 'me-1' } }),
}));

vi.mock('@/api/pings/pings.queries', () => ({
    usePings: vi.fn().mockReturnValue({ data: { pings: [] } }),
}));

vi.mock('@/api/servers/servers.api', () => ({
    serversApi: {
        updateChannel: vi.fn().mockResolvedValue(undefined),
        reorderChannels: vi.fn().mockResolvedValue(undefined),
        reorderCategories: vi.fn().mockResolvedValue(undefined),
    },
}));

vi.mock('@/ws/messages', () => ({
    wsMessages: { markChannelRead: vi.fn() },
}));

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn().mockReturnValue(vi.fn()),
}));

vi.mock('./ChannelItem', () => {
    const ChannelItem = ({
        name,
        onClick,
    }: {
        name: string;
        onClick?: () => void;
    }) => (
        <button type="button" onClick={onClick}>
            {name}
        </button>
    );
    return { ChannelItem };
});

interface ReorderGroupProps {
    children: React.ReactNode;
    onReorder: (items: unknown[]) => void;
    style?: React.CSSProperties;
}
interface ReorderItemProps {
    children: React.ReactNode;
    value: { id: string };
    onDragStart?: () => void;
    onDragEnd?: () => void;
}

const reorderState: { onReorder: ((items: unknown[]) => void) | null } = {
    onReorder: null,
};
let dragHandlersById: Record<
    string,
    { onDragStart?: () => void; onDragEnd?: () => void }
> = {};

vi.mock('framer-motion', async (importOriginal) => {
    const actual = await importOriginal<typeof FramerMotion>();
    const Group = ({ children, onReorder, style }: ReorderGroupProps) => {
        reorderState.onReorder = onReorder;
        return (
            <div data-testid="reorder-group" style={style}>
                {children}
            </div>
        );
    };
    const Item = ({
        children,
        value,
        onDragStart,
        onDragEnd,
    }: ReorderItemProps) => {
        dragHandlersById[value.id] = { onDragStart, onDragEnd };
        return <div data-testid={`reorder-item-${value.id}`}>{children}</div>;
    };
    return {
        ...actual,
        Reorder: { Group, Item },
    };
});

vi.mock('@tanstack/react-virtual', () => ({
    useVirtualizer: vi
        .fn()
        .mockImplementation((options: { count: number }) => ({
            getVirtualItems: (): {
                index: number;
                start: number;
                key: number;
            }[] =>
                Array.from({ length: options.count }).map((_, i) => ({
                    index: i,
                    start: i * 32,
                    key: i,
                })),
            getTotalSize: (): number => options.count * 32,
            measureElement: vi.fn(),
        })),
}));

const category1: Category = {
    id: 'cat-1',
    name: 'General',
    serverId: 'server-1',
    position: 0,
};
const channel1: Channel = {
    id: 'chan-1',
    name: 'general',
    serverId: 'server-1',
    type: 'text',
    position: 0,
    categoryId: 'cat-1',
};
const channel2: Channel = {
    id: 'chan-2',
    name: 'random',
    serverId: 'server-1',
    type: 'text',
    position: 1,
    categoryId: 'cat-1',
};

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

function listElement(
    categories: Category[],
    channels: Channel[],
    selectedChannelId: string | null = null,
): React.ReactElement {
    return (
        <QueryClientProvider client={queryClient}>
            <ChannelList
                categories={categories}
                channels={channels}
                scrollRef={{ current: null }}
                selectedChannelId={selectedChannelId}
            />
        </QueryClientProvider>
    );
}

// ChannelList's props always start empty (React Query's data is undefined
// while loading) and get populated on a later render - never with real data
// already present on mount. The item-sync effect relies on that transition
// (see the nextItems/prevSyncItemsRef comparison in ChannelList.tsx), so
// tests must reproduce it or items never populate.
function renderChannelList(props: {
    channels: Channel[];
    categories: Category[];
    selectedChannelId?: string | null;
}): ReturnType<typeof render> {
    const result = render(listElement([], [], props.selectedChannelId ?? null));
    act((): void => {
        result.rerender(
            listElement(
                props.categories,
                props.channels,
                props.selectedChannelId ?? null,
            ),
        );
    });
    return result;
}

describe('ChannelList state cluster', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
        reorderState.onReorder = null;
        dragHandlersById = {};

        vi.mocked(useAppSelector).mockImplementation((selector) =>
            selector({
                nav: { selectedServerId: 'server-1' },
                voice: { voiceParticipants: {} },
            } as never),
        );

        vi.mocked(Permissions.usePermissions).mockReturnValue({
            hasPermission: (): boolean => true,
            permissions: {} as never,
            isOwner: true,
            isLoading: false,
            isTimedOut: false,
            remainingTimeoutMs: 0,
        });
    });

    afterEach((): void => {
        vi.useRealTimers();
    });

    it('renders channels grouped under their category', (): void => {
        renderChannelList({
            channels: [channel1, channel2],
            categories: [category1],
        });

        expect(screen.getByText('General')).toBeInTheDocument();
        expect(screen.getByText('general')).toBeInTheDocument();
        expect(screen.getByText('random')).toBeInTheDocument();
    });

    it('toggling a category collapses and re-expands its channels', (): void => {
        renderChannelList({
            channels: [channel1, channel2],
            categories: [category1],
        });

        expect(screen.getByText('general')).toBeInTheDocument();

        act((): void => {
            screen.getByText('General').click();
        });
        expect(screen.queryByText('general')).not.toBeInTheDocument();

        act((): void => {
            screen.getByText('General').click();
        });
        expect(screen.getByText('general')).toBeInTheDocument();
    });

    it('resets collapsed-category state when the selected server changes', (): void => {
        const { rerender } = renderChannelList({
            channels: [channel1, channel2],
            categories: [category1],
        });

        act((): void => {
            screen.getByText('General').click();
        });
        expect(screen.queryByText('general')).not.toBeInTheDocument();

        vi.mocked(useAppSelector).mockImplementation((selector) =>
            selector({
                nav: { selectedServerId: 'server-2' },
                voice: { voiceParticipants: {} },
            } as never),
        );

        // Switching servers means a fresh channel/category fetch for server-2:
        // starts empty, then populates - same loading transition as initial mount.
        act((): void => {
            rerender(listElement([], []));
        });
        act((): void => {
            rerender(listElement([category1], [channel1, channel2]));
        });

        expect(screen.getByText('general')).toBeInTheDocument();
    });

    it('reflects a drag reorder immediately in the rendered order', (): void => {
        renderChannelList({
            channels: [channel1, channel2],
            categories: [category1],
        });

        const itemsBefore = screen
            .getAllByRole('button')
            .map((el) => el.textContent);
        expect(itemsBefore).toContain('general');

        act((): void => {
            reorderState.onReorder?.([
                { type: 'category', id: 'cat-1', data: category1 },
                { type: 'channel', id: 'chan-2', data: channel2 },
                { type: 'channel', id: 'chan-1', data: channel1 },
            ]);
        });

        const group = screen.getByTestId('reorder-group');
        const order = [
            ...group.querySelectorAll<HTMLElement>(
                '[data-testid^="reorder-item-"]',
            ),
        ].map((el) => el.dataset.testid);
        expect(order).toEqual([
            'reorder-item-cat-1',
            'reorder-item-chan-2',
            'reorder-item-chan-1',
        ]);
    });

    it('ignores prop-driven channel updates while a reorder is in flight, then resyncs after drag end', async (): Promise<void> => {
        vi.useFakeTimers();
        const { rerender } = renderChannelList({
            channels: [channel1, channel2],
            categories: [category1],
        });

        act((): void => {
            dragHandlersById['chan-1']?.onDragStart?.();
        });

        // While reordering, a new channel arriving via props should not appear yet.
        const channel3: Channel = {
            ...channel2,
            id: 'chan-3',
            name: 'newcomer',
        };
        act((): void => {
            rerender(listElement([category1], [channel1, channel2, channel3]));
        });
        expect(screen.queryByText('newcomer')).not.toBeInTheDocument();

        await act(async (): Promise<void> => {
            dragHandlersById['chan-1']?.onDragEnd?.();
            await Promise.resolve();
            await Promise.resolve();
        });

        expect(serversApi.reorderChannels).toHaveBeenCalled();

        // Still within the 500ms syncLock window: still suppressed.
        act((): void => {
            rerender(listElement([category1], [channel1, channel2, channel3]));
        });
        expect(screen.queryByText('newcomer')).not.toBeInTheDocument();

        await act(async (): Promise<void> => {
            await vi.advanceTimersByTimeAsync(500);
        });

        act((): void => {
            rerender(listElement([category1], [channel1, channel2, channel3]));
        });
        expect(screen.getByText('newcomer')).toBeInTheDocument();
    });
});
