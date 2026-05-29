import { render } from '@testing-library/react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
    setSelectedChannelId,
    setSelectedServerId,
    setTargetMessageId,
} from '@/store/slices/navSlice';

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

describe('NavigationSync', (): void => {
    const mockNavigate = vi.fn();
    const mockDispatch = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();
        vi.mocked(useNavigate).mockReturnValue(mockNavigate);
        vi.mocked(useAppDispatch).mockReturnValue(mockDispatch);
        vi.mocked(useAppSelector).mockReturnValue({
            selectedChannelId: null,
            selectedServerId: null,
        } as never);
    });

    it('navigates to @me when serverId is invalid', (): void => {
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

    it('navigates to server root when channelId is invalid', (): void => {
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

    it('navigates to channel root when messageId is invalid', (): void => {
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

    it('navigates to @me when userId is invalid', (): void => {
        vi.mocked(useLocation).mockReturnValue({
            pathname: '/chat/@user/invalid',
        } as never);
        vi.mocked(useParams).mockReturnValue({ userId: 'invalid' });

        render(<NavigationSync />);

        expect(mockNavigate).toHaveBeenCalledWith('/chat/@me', {
            replace: true,
        });
    });

    it('clears channel context on server self-roles pages', (): void => {
        const validServerId = '507f1f77bcf86cd799439011';
        vi.mocked(useLocation).mockReturnValue({
            pathname: `/chat/@server/${validServerId}/self-roles`,
        } as never);
        vi.mocked(useParams).mockReturnValue({
            serverId: validServerId,
        });
        vi.mocked(useAppSelector).mockReturnValue({
            selectedChannelId: '507f1f77bcf86cd799439012',
            selectedServerId: validServerId,
        } as never);

        render(<NavigationSync />);

        expect(mockDispatch).toHaveBeenCalledWith(setSelectedChannelId(null));
        expect(mockDispatch).toHaveBeenCalledWith(setTargetMessageId(null));
    });

    it('does not leave the restored last channel active when entering self-roles from another server', (): void => {
        const validServerId = '507f1f77bcf86cd799439011';
        vi.mocked(useLocation).mockReturnValue({
            pathname: `/chat/@server/${validServerId}/self-roles`,
        } as never);
        vi.mocked(useParams).mockReturnValue({
            serverId: validServerId,
        });
        vi.mocked(useAppSelector).mockReturnValue({
            selectedChannelId: '507f1f77bcf86cd799439012',
            selectedServerId: '507f1f77bcf86cd799439013',
        } as never);

        render(<NavigationSync />);

        expect(mockDispatch).toHaveBeenCalledWith(
            setSelectedServerId(validServerId),
        );
        expect(mockDispatch).toHaveBeenCalledWith(setSelectedChannelId(null));
        expect(mockDispatch).toHaveBeenCalledWith(setTargetMessageId(null));
    });
});
