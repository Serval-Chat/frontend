import { render } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as ServerQueries from '@/api/servers/servers.queries';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    clearLastOpenedChannelForServer,
    setSelectedChannelId,
    setTargetMessageId,
} from '@/store/slices/navSlice';

import { ServerSection } from './ServerSection';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
    useParams: vi.fn().mockReturnValue({}),
    useLocation: vi.fn().mockReturnValue({ pathname: '/' }),
}));

vi.mock('@/store/hooks', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@/store/slices/navSlice', () => ({
    clearLastOpenedChannelForServer: vi
        .fn()
        .mockReturnValue('mockClearLastOpenedChannelForServer'),
    setSelectedChannelId: vi.fn().mockReturnValue('mockSetSelectedChannelId'),
    setTargetMessageId: vi.fn().mockReturnValue('mockSetTargetMessageId'),
}));

vi.mock('@/hooks/ws/useServerWS', () => ({
    useServerWS: vi.fn(),
}));

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
vi.mock('@/ui/components/common/LoadingSpinner', () => {
    const LoadingSpinner = () => <div data-testid="loading-spinner" />;
    return { LoadingSpinner };
});

describe('ServerSection fallback logic', (): void => {
    const mockNavigate = vi.fn();
    const mockDispatch = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useAppSelector).mockImplementation(
            (): never => vi.fn() as never,
        );

        // Setup default dispatch mock
        vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);

        vi.mocked(ServerQueries.useCategories).mockReturnValue({
            data: [],
            isLoading: false,
        } as never);
        vi.mocked(ServerQueries.useOnboarding).mockReturnValue({
            data: {
                onboarding: {
                    enabled: false,
                    guidelines: '',
                    selfAssignableRoleIds: [],
                    landingChannelId: null,
                    welcomeChannelIds: [],
                },
                member: {
                    hiddenChannelIds: [],
                    hiddenCategoryIds: [],
                    roles: [],
                },
            },
        } as never);
    });

    it('navigates to @me if server queries error out (fake server ID)', (): void => {
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            const state = {
                nav: {
                    selectedServerId: 'fakeServer123',
                    selectedChannelId: null,
                    lastOpenedChannelByServer: {},
                },
            };
            return selector(state as never);
        });

        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: true,
        } as never);

        vi.mocked(ServerQueries.useChannels).mockReturnValue({
            data: undefined,
            isLoading: false,
            isError: false,
        } as never);

        render(<ServerSection />);

        expect(mockNavigate).toHaveBeenCalledWith('/chat/@me', {
            replace: true,
        });
    });

    it('navigates to server root if chosen channel is not in the channel list (fake channel ID)', (): void => {
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            const state = {
                nav: {
                    selectedServerId: 'validServer123',
                    selectedChannelId: 'fakeChannel456',
                    lastOpenedChannelByServer: {},
                },
            };
            return selector(state as never);
        });

        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: { id: 'validServer123', name: 'Valid Server' },
            isLoading: false,
            isError: false,
        } as never);

        vi.mocked(ServerQueries.useChannels).mockReturnValue({
            data: [{ id: 'realChannel1' }, { id: 'realChannel2' }],
            isLoading: false,
            isError: false,
        } as never);

        render(<ServerSection />);

        expect(mockDispatch).toHaveBeenCalledWith(setSelectedChannelId(null));
        expect(mockDispatch).toHaveBeenCalledWith(setTargetMessageId(null));
        expect(mockDispatch).toHaveBeenCalledWith(
            clearLastOpenedChannelForServer('validServer123'),
        );
        expect(mockNavigate).toHaveBeenCalledWith(
            '/chat/@server/validServer123',
            { replace: true },
        );
    });

    it('does not navigate from server root back to a deleted last-opened channel', (): void => {
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            const state = {
                nav: {
                    selectedServerId: 'validServer123',
                    selectedChannelId: null,
                    lastOpenedChannelByServer: {
                        validServer123: 'deletedChannel456',
                    },
                },
            };
            return selector(state as never);
        });

        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: { id: 'validServer123', name: 'Valid Server' },
            isLoading: false,
            isError: false,
        } as never);

        vi.mocked(ServerQueries.useChannels).mockReturnValue({
            data: [
                {
                    id: 'realChannel1',
                    type: 'text',
                    position: 0,
                },
            ],
            isPlaceholderData: false,
            isError: false,
        } as never);

        render(<ServerSection />);

        expect(mockNavigate).toHaveBeenCalledWith(
            '/chat/@server/validServer123/channel/realChannel1',
            { replace: true },
        );
        expect(mockNavigate).not.toHaveBeenCalledWith(
            '/chat/@server/validServer123/channel/deletedChannel456',
            { replace: true },
        );
        expect(mockDispatch).toHaveBeenCalledWith(
            clearLastOpenedChannelForServer('validServer123'),
        );
    });
});
