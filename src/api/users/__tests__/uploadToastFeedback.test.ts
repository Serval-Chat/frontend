import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usersApi } from '@/api/users/users.api';
import {
    useUpdateBanner,
    useUpdateProfilePicture,
} from '@/api/users/users.queries';

const mockShowToast = vi.fn();

vi.mock('@/ui/components/common/Toast', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('@/api/users/users.api', () => ({
    usersApi: {
        updateProfilePicture: vi.fn(),
        updateBanner: vi.fn(),
    },
}));

vi.mock('@/utils/extractApiError', () => ({
    extractApiError: (_err: unknown, fallback: string): string =>
        _err instanceof Error ? _err.message : fallback,
}));

vi.mock('@/utils/authToken', () => ({ hasAuthToken: () => true }));

const makeWrapper = (): React.FC<{ children: React.ReactNode }> => {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    const Wrapper = ({
        children,
    }: {
        children: React.ReactNode;
    }): React.ReactElement =>
        React.createElement(QueryClientProvider, { client: queryClient }, children);
    Wrapper.displayName = 'QueryClientWrapper';
    return Wrapper;
};

const mockFile = new File(['data'], 'avatar.webp', { type: 'image/webp' });


describe('useUpdateProfilePicture', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a success toast when the profile picture upload succeeds', async () => {
        vi.mocked(usersApi.updateProfilePicture).mockResolvedValue({
            message: 'ok',
            profilePicture: '/api/v1/profile/picture/user123.webp',
        });

        const { result } = renderHook(() => useUpdateProfilePicture(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate(mockFile);
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockShowToast).toHaveBeenCalledWith('Profile picture updated', 'success');
    });

    it('shows an error toast when the profile picture upload fails', async () => {
        vi.mocked(usersApi.updateProfilePicture).mockRejectedValue(
            new Error('Invalid image format'),
        );

        const { result } = renderHook(() => useUpdateProfilePicture(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate(mockFile);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(mockShowToast).toHaveBeenCalledWith('Invalid image format', 'error');
    });

    it('shows a generic error toast when the error has no message', async () => {
        vi.mocked(usersApi.updateProfilePicture).mockRejectedValue('unknown');

        const { result } = renderHook(() => useUpdateProfilePicture(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate(mockFile);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(mockShowToast).toHaveBeenCalledWith(
            'Failed to update profile picture',
            'error',
        );
    });
});


describe('useUpdateBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a success toast when the profile banner upload succeeds', async () => {
        vi.mocked(usersApi.updateBanner).mockResolvedValue({
            message: 'ok',
            banner: '/api/v1/profile/banner/user123.webp',
        });

        const { result } = renderHook(() => useUpdateBanner(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate(mockFile);
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockShowToast).toHaveBeenCalledWith('Profile banner updated', 'success');
    });

    it('shows an error toast when the profile banner upload fails', async () => {
        vi.mocked(usersApi.updateBanner).mockRejectedValue(
            new Error('File exceeds size limit'),
        );

        const { result } = renderHook(() => useUpdateBanner(), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate(mockFile);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(mockShowToast).toHaveBeenCalledWith(
            'File exceeds size limit',
            'error',
        );
    });
});
