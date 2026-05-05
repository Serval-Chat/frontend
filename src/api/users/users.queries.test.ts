import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usersApi } from '@/api/users/users.api';

import { useUserById } from './users.queries';

vi.mock('@/api/users/users.api', () => ({
    usersApi: {
        getById: vi.fn(),
    },
}));

vi.mock('@/utils/authToken', () => ({
    hasAuthToken: () => true,
}));

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
        React.createElement(
            QueryClientProvider,
            { client: queryClient },
            children,
        );
    Wrapper.displayName = 'QueryClientWrapper';
    return Wrapper;
};

describe('useUserById', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('does not fetch for IDs starting with @ (malformed mentions)', async () => {
        vi.mocked(usersApi.getById).mockResolvedValue({
            _id: 'bad',
            username: 'bad',
        } as never);

        const consoleSpy = vi
            .spyOn(console, 'error')
            .mockImplementation(() => {});

        const { result } = renderHook(() => useUserById('@catflare'), {
            wrapper: makeWrapper(),
        });

        await waitFor(() => expect(result.current.isLoading).toBe(false));
        expect(usersApi.getById).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('fetches normally for valid ObjectId-style IDs', async () => {
        vi.mocked(usersApi.getById).mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            username: 'alice',
        } as never);

        const { result } = renderHook(
            () => useUserById('507f1f77bcf86cd799439011'),
            { wrapper: makeWrapper() },
        );

        await waitFor(() => expect(result.current.isSuccess).toBe(true));
        expect(usersApi.getById).toHaveBeenCalledWith(
            '507f1f77bcf86cd799439011',
        );
    });
});
