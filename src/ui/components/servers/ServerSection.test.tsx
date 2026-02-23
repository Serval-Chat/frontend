import { render } from '@testing-library/react';
import { useNavigate } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as ServerQueries from '@/api/servers/servers.queries';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    setSelectedChannelId,
    setTargetMessageId,
} from '@/store/slices/navSlice';

import { ServerSection } from './ServerSection';

vi.mock('react-router-dom', () => ({
    useNavigate: vi.fn(),
}));

vi.mock('@/store/hooks', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

vi.mock('@/store/slices/navSlice', () => ({
    setSelectedChannelId: vi.fn().mockReturnValue('mockSetSelectedChannelId'),
    setTargetMessageId: vi.fn().mockReturnValue('mockSetTargetMessageId'),
}));

vi.mock('@/hooks/ws/useServerWS', () => ({
    useServerWS: vi.fn(),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useCategories: vi.fn(),
    useChannels: vi.fn(),
    useServerDetails: vi.fn(),
}));

vi.mock('./ServerBanner', () => ({
    ServerBanner: () => <div data-testid="server-banner" />,
}));
vi.mock('./ChannelList', () => ({
    ChannelList: () => <div data-testid="channel-list" />,
}));
vi.mock('@/ui/components/common/LoadingSpinner', () => ({
    LoadingSpinner: () => <div data-testid="loading-spinner" />,
}));

describe('ServerSection fallback logic', () => {
    const mockNavigate = vi.fn();
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useAppSelector).mockImplementation(() => vi.fn() as never);

        // Setup default dispatch mock
        vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);

        vi.mocked(ServerQueries.useCategories).mockReturnValue({
            data: [],
            isLoading: false,
        } as never);
    });

    it('navigates to @me if server queries error out (fake server ID)', () => {
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            const state = {
                nav: {
                    selectedServerId: 'fakeServer123',
                    selectedChannelId: null,
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

    it('navigates to server root if chosen channel is not in the channel list (fake channel ID)', () => {
        vi.mocked(useAppSelector).mockImplementation((selector) => {
            const state = {
                nav: {
                    selectedServerId: 'validServer123',
                    selectedChannelId: 'fakeChannel456',
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
            data: [{ _id: 'realChannel1' }, { _id: 'realChannel2' }],
            isLoading: false,
            isError: false,
        } as never);

        render(<ServerSection />);

        expect(mockDispatch).toHaveBeenCalledWith(setSelectedChannelId(null));
        expect(mockDispatch).toHaveBeenCalledWith(setTargetMessageId(null));
        expect(mockNavigate).toHaveBeenCalledWith(
            '/chat/@server/validServer123',
            { replace: true },
        );
    });
});
