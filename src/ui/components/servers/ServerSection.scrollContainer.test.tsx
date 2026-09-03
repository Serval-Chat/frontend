import { render } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
    useCategories,
    useChannels,
    useOnboarding,
    useServerDetails,
} from '@/api/servers/servers.queries';
import type { Category, Channel } from '@/api/servers/servers.types';
import { useAppSelector } from '@/store/hooks';

import { ServerSection } from './ServerSection';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn().mockReturnValue(vi.fn()),
    useParams: vi.fn().mockReturnValue({}),
    useLocation: vi.fn(),
}));

vi.mock('@/store/hooks', () => ({
    useAppDispatch: vi.fn().mockReturnValue(vi.fn()),
    useAppSelector: vi.fn(),
}));

vi.mock('@/hooks/ws/useServerWS', () => ({ useServerWS: vi.fn() }));

vi.mock('@/api/servers/servers.queries', () => ({
    useCategories: vi.fn(),
    useChannels: vi.fn(),
    useOnboarding: vi.fn(),
    useServerDetails: vi.fn(),
}));

vi.mock('./ServerBanner', () => {
    const ServerBanner = () => <div data-testid="server-banner" />;
    return { ServerBanner };
});
vi.mock('./ChannelList', () => {
    const ChannelList = () => <div data-testid="channel-list" />;
    return { ChannelList };
});
vi.mock('./SidebarSkeleton', () => {
    const SidebarSkeleton = () => <div data-testid="sidebar-skeleton" />;
    return { SidebarSkeleton };
});

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

const setQueries = (loaded: boolean): void => {
    vi.mocked(useServerDetails).mockReturnValue({
        data: loaded ? { id: 'server-1', name: 'Server' } : undefined,
        isLoading: !loaded,
        isError: false,
    } as never);
    vi.mocked(useChannels).mockReturnValue({
        data: loaded ? [channel1] : undefined,
        isPlaceholderData: false,
        isError: false,
    } as never);
    vi.mocked(useCategories).mockReturnValue({
        data: loaded ? [category1] : undefined,
        isPlaceholderData: false,
    } as never);
    vi.mocked(useOnboarding).mockReturnValue({
        data: loaded
            ? {
                  onboarding: { selfAssignableRoleIds: [] },
                  member: { roles: [] },
              }
            : undefined,
    } as never);
};

const scrollContainer = (container: HTMLElement): HTMLElement | null =>
    container.querySelector('.custom-scrollbar');

describe('ServerSection scroll container', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(useLocation).mockReturnValue({
            pathname: '/chat/@server/server-1/self-roles',
        } as never);
        vi.mocked(useAppSelector).mockImplementation((selector) =>
            selector({
                nav: {
                    selectedServerId: 'server-1',
                    selectedChannelId: null,
                    lastOpenedChannelByServer: {},
                },
                voice: { voiceParticipants: {} },
            } as never),
        );
    });

    it('mounts the scroll container before the channel list, and keeps the same element once loaded', (): void => {
        setQueries(false);
        const { container, rerender } = render(<ServerSection />);

        const whileLoading = scrollContainer(container);
        expect(whileLoading).not.toBeNull();

        setQueries(true);
        rerender(<ServerSection />);

        const afterLoad = scrollContainer(container);
        expect(afterLoad).toBe(whileLoading);
    });
});
