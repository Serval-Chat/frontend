import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import type * as UsersQueries from '@/api/users/users.queries';

import { ReplyPreview } from './ReplyPreview';

vi.mock('@/api/users/users.queries', async (importOriginal) => {
    const actual = await importOriginal<typeof UsersQueries>();
    return {
        ...actual,
        useUserById: vi.fn(() => ({
            data: {
                _id: '690cdf6250f11be9566ea1ea',
                username: 'gorku',
                displayName: 'gorciu',
            },
            isLoading: false,
        })),
    };
});

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ReplyPreview', () => {
    it('renders user mention tokens in replied message text', () => {
        render(
            <TestWrapper>
                <ReplyPreview
                    text="<userid:'690cdf6250f11be9566ea1ea'> ui bug"
                    user={
                        {
                            _id: '690cdf6250f11be9566ea1eb',
                            username: 'gorku',
                            displayName: 'gorciu',
                        } as never
                    }
                />
            </TestWrapper>,
        );

        expect(screen.getByText('@gorciu')).toBeInTheDocument();
        expect(
            screen.queryByText("<userid:'690cdf6250f11be9566ea1ea'>"),
        ).not.toBeInTheDocument();
        expect(screen.getByText(/ui bug/)).toBeInTheDocument();
    });
});
