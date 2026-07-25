import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { serversApi } from '@/api/servers/servers.api';
import {
    useUpdateServerBanner,
    useUpdateServerIcon,
} from '@/api/servers/servers.queries';

const mockShowToast = vi.fn();

vi.mock('@/ui/components/common/Toast', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('@/api/servers/servers.api', () => ({
    serversApi: {
        uploadServerIcon: vi.fn(),
        uploadServerBanner: vi.fn(),
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

const mockFile = new File(['data'], 'icon.gif', { type: 'image/gif' });
const serverId = 'server123';

describe('useUpdateServerIcon', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a success toast when the icon upload succeeds', async () => {
        vi.mocked(serversApi.uploadServerIcon).mockResolvedValue('/api/v1/servers/icon/server123-1.gif');

        const { result } = renderHook(() => useUpdateServerIcon(serverId), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate(mockFile);
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockShowToast).toHaveBeenCalledWith('Server icon updated', 'success');
    });

    it('shows an error toast when the icon upload fails', async () => {
        vi.mocked(serversApi.uploadServerIcon).mockRejectedValue(
            new Error('File too large'),
        );

        const { result } = renderHook(() => useUpdateServerIcon(serverId), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate(mockFile);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(mockShowToast).toHaveBeenCalledWith('File too large', 'error');
    });

    it('shows a generic error toast when the error has no message', async () => {
        vi.mocked(serversApi.uploadServerIcon).mockRejectedValue('unknown');

        const { result } = renderHook(() => useUpdateServerIcon(serverId), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate(mockFile);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(mockShowToast).toHaveBeenCalledWith(
            'Failed to update server icon',
            'error',
        );
    });
});

describe('useUpdateServerBanner', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('shows a success toast when the banner upload succeeds', async () => {
        vi.mocked(serversApi.uploadServerBanner).mockResolvedValue(
            '/api/v1/servers/banner/server123-banner-1.gif',
        );

        const { result } = renderHook(() => useUpdateServerBanner(serverId), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate(mockFile);
        });

        await waitFor(() => expect(result.current.isSuccess).toBe(true));

        expect(mockShowToast).toHaveBeenCalledWith('Server banner updated', 'success');
    });

    it('shows an error toast when the banner upload fails', async () => {
        vi.mocked(serversApi.uploadServerBanner).mockRejectedValue(
            new Error('Unsupported file type'),
        );

        const { result } = renderHook(() => useUpdateServerBanner(serverId), {
            wrapper: makeWrapper(),
        });

        await act(async () => {
            result.current.mutate(mockFile);
        });

        await waitFor(() => expect(result.current.isError).toBe(true));

        expect(mockShowToast).toHaveBeenCalledWith('Unsupported file type', 'error');
    });
});
