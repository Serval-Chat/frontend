import React from 'react';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { usersApi } from '@/api/users/users.api';
import type { User } from '@/api/users/users.types';

import { useUpdateStyle, useUserById } from './users.queries';

vi.mock('@/api/users/users.api', () => ({
    usersApi: {
        getById: vi.fn(),
        updateStyle: vi.fn(),
    },
}));

vi.mock('@/utils/authToken', (): { hasAuthToken: () => boolean } => ({
    hasAuthToken: (): true => true,
}));

const makeWrapper = (): React.FC<{ children: React.ReactNode }> => {
    const { wrapper } = makeHarness();
    return wrapper;
};

const makeHarness = (): {
    queryClient: QueryClient;
    wrapper: React.FC<{ children: React.ReactNode }>;
} => {
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
    return { queryClient, wrapper: Wrapper };
};

describe('useUserById', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
    });

    it('does not fetch for IDs starting with @ (malformed mentions)', async (): Promise<void> => {
        vi.mocked(usersApi.getById).mockResolvedValue({
            _id: 'bad',
            username: 'bad',
        } as never);

        const consoleSpy = vi
            .spyOn(console, 'error')
            .mockImplementation((): void => {});

        const { result } = renderHook(() => useUserById('@catflare'), {
            wrapper: makeWrapper(),
        });

        await waitFor((): void => expect(result.current.isLoading).toBe(false));
        expect(usersApi.getById).not.toHaveBeenCalled();
        consoleSpy.mockRestore();
    });

    it('fetches normally for valid ObjectId-style IDs', async (): Promise<void> => {
        vi.mocked(usersApi.getById).mockResolvedValue({
            _id: '507f1f77bcf86cd799439011',
            username: 'alice',
        } as never);

        const { result } = renderHook(
            () => useUserById('507f1f77bcf86cd799439011'),
            { wrapper: makeWrapper() },
        );

        await waitFor((): void => expect(result.current.isSuccess).toBe(true));
        expect(usersApi.getById).toHaveBeenCalledWith(
            '507f1f77bcf86cd799439011',
        );
    });
});

describe('useUpdateStyle', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
    });

    it('updates cached style from submitted values when the response omits disabled fields', async (): Promise<void> => {
        const { queryClient, wrapper } = makeHarness();
        queryClient.setQueryData<User>(['me'], {
            _id: 'user-1',
            login: 'alice',
            username: 'Alice',
            createdAt: new Date(),
            usernameGlow: {
                enabled: true,
                color: '#ffffff',
                intensity: 5,
            },
            usernameGradient: {
                enabled: true,
                colors: ['#ff0000', '#00ff00'],
                angle: 90,
            },
        });

        vi.mocked(usersApi.updateStyle).mockResolvedValue({
            message: 'updated',
        });

        const { result } = renderHook(() => useUpdateStyle(), { wrapper });

        act((): void => {
            result.current.mutate({
                usernameGlow: {
                    enabled: false,
                    color: '#ffffff',
                    intensity: 5,
                },
                usernameGradient: {
                    enabled: true,
                    colors: ['#ff0000', '#00ff00'],
                    angle: 90,
                },
            });
        });

        await waitFor((): void =>
            expect(
                queryClient.getQueryData<User>(['me'])?.usernameGlow?.enabled,
            ).toBe(false),
        );
    });
});
