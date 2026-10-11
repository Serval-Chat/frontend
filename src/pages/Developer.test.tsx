import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';

import { Developer } from './Developer';

vi.mock(
    '@/ui/components/settings/DeveloperSettings',
    (): {
        DeveloperSettings: () => React.ReactElement;
    } => ({
        DeveloperSettings: (): React.ReactElement => (
            <div data-testid="developer-settings" />
        ),
    }),
);

const renderAt = (path: string): void => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });
    render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[path]}>
                <Routes>
                    <Route element={<Developer />} path="/developer/*" />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
};

describe('Developer', (): void => {
    it('renders the developer settings section, not the placeholder', (): void => {
        renderAt('/developer/settings');

        expect(screen.getByTestId('developer-settings')).toBeInTheDocument();
        expect(screen.queryByText('Coming Soon')).toBeNull();
        expect(
            screen.getByRole('heading', {
                level: 1,
                name: 'Developer Settings',
            }),
        ).toBeInTheDocument();
    });

    it('keeps the under-development placeholder for unknown sections', (): void => {
        renderAt('/developer/does-not-exist');

        expect(screen.getByText('Coming Soon')).toBeInTheDocument();
        expect(
            screen.getByText('This section is under development.'),
        ).toBeInTheDocument();
    });

    it('renders the bot creator page with its create form', (): void => {
        renderAt('/developer/bot-creator');

        expect(
            screen.getByRole('heading', { level: 1, name: 'Create a Bot' }),
        ).toBeInTheDocument();
        expect(screen.getByLabelText('Name')).toBeInTheDocument();
    });
});
