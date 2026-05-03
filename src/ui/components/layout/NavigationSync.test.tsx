import { render } from '@testing-library/react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@/store/hooks';

import { NavigationSync } from './NavigationSync';

vi.mock('react-router-dom', () => ({
    useLocation: vi.fn(),
    useNavigate: vi.fn(),
    useParams: vi.fn(),
}));

vi.mock('@/store/hooks', () => ({
    useAppDispatch: vi.fn(),
    useAppSelector: vi.fn(),
}));

describe('NavigationSync', () => {
    const mockNavigate = vi.fn();
    const mockDispatch = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);
        vi.mocked(useAppSelector).mockReturnValue({
            selectedChannelId: null,
            selectedServerId: null,
        } as never);
    });

    it('navigates to @me when serverId is invalid', () => {
        vi.mocked(useLocation).mockReturnValue({
            pathname: '/chat/@server/invalid/channel/123',
        } as never);
        vi.mocked(useParams).mockReturnValue({
            channelId: '123',
            serverId: 'invalid',
        });

        render(<NavigationSync />);

        expect(mockNavigate).toHaveBeenCalledWith('/chat/@me', {
            replace: true,
        });
    });

    it('navigates to server root when channelId is invalid', () => {
        const validServerId = '507f1f77bcf86cd799439011';
        vi.mocked(useLocation).mockReturnValue({
            pathname: `/chat/@server/${validServerId}/channel/invalid`,
        } as never);
        vi.mocked(useParams).mockReturnValue({
            channelId: 'invalid',
            serverId: validServerId,
        });

        render(<NavigationSync />);

        expect(mockNavigate).toHaveBeenCalledWith(
            `/chat/@server/${validServerId}`,
            { replace: true },
        );
    });

    it('navigates to channel root when messageId is invalid', () => {
        const validServerId = '507f1f77bcf86cd799439011';
        const validChannelId = '507f1f77bcf86cd799439012';
        vi.mocked(useLocation).mockReturnValue({
            pathname: `/chat/@server/${validServerId}/channel/${validChannelId}/message/invalid`,
        } as never);
        vi.mocked(useParams).mockReturnValue({
            channelId: validChannelId,
            messageId: 'invalid',
            serverId: validServerId,
        });

        render(<NavigationSync />);

        expect(mockNavigate).toHaveBeenCalledWith(
            `/chat/@server/${validServerId}/channel/${validChannelId}`,
            { replace: true },
        );
    });

    it('navigates to @me when userId is invalid', () => {
        vi.mocked(useLocation).mockReturnValue({
            pathname: '/chat/@user/invalid',
        } as never);
        vi.mocked(useParams).mockReturnValue({ userId: 'invalid' });

        render(<NavigationSync />);

        expect(mockNavigate).toHaveBeenCalledWith('/chat/@me', {
            replace: true,
        });
    });
});
