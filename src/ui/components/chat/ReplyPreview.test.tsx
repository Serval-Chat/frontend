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
                id: '0327554478565752821',
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

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
);

describe('ReplyPreview', (): void => {
    it('renders user mention tokens in replied message text', (): void => {
        render(
            <TestWrapper>
                <ReplyPreview
                    text="<userid:'0327554478565752821'> ui bug"
                    user={
                        {
                            id: '0327554478565752822',
                            username: 'gorku',
                            displayName: 'gorciu',
                        } as never
                    }
                />
            </TestWrapper>,
        );

        expect(screen.getByText('@gorciu')).toBeInTheDocument();
        expect(
            screen.queryByText("<userid:'0327554478565752821'>"),
        ).not.toBeInTheDocument();
        expect(screen.getByText(/ui bug/)).toBeInTheDocument();
    });
});
