import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authApi } from '@/api/auth/auth.api';
import * as authTokenModule from '@/utils/authToken';

import { Login } from './Login';

vi.mock('@/api/auth/auth.api', () => ({
    authApi: {
        login: vi.fn(),
        verifyTwoFactor: vi.fn(),
    },
}));

vi.mock('@/lib/pushClient', () => ({
    setupWebPush: vi.fn().mockResolvedValue(true),
    checkAndMigrateVapid: vi.fn().mockResolvedValue(true),
    listenForSwNavigation: vi.fn(),
}));

const LocationDisplay = () => {
    const location = useLocation();
    return <div data-testid="location-display">{location.pathname}</div>;
};

const renderWithProviders = (
    initialEntries = ['/login'],
    isAuthenticated = false,
): ReturnType<typeof render> => {
    vi.spyOn(authTokenModule, 'hasAuthToken').mockReturnValue(isAuthenticated);

    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={initialEntries}>
                <Routes>
                    <Route element={<Login />} path="/login" />
                    <Route element={<LocationDisplay />} path="/chat/@me" />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
};

describe('Login Page Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
    });

    it('requires both email and password to enable the submit button', () => {
        renderWithProviders();
        const button = screen.getByRole('button', { name: /There we go!/i });
        expect(button).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('E-mail'), {
            target: { value: 'user@test.com' },
        });
        expect(button).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: 'password123' },
        });
        expect(button).not.toBeDisabled();
    });

    it('submits on enter key if fields are valid', async () => {
        vi.mocked(authApi.login).mockResolvedValueOnce({
            token: 'mock-token',
            username: 'mock-user',
        });
        renderWithProviders();

        fireEvent.change(screen.getByPlaceholderText('E-mail'), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: 'password123' },
        });

        const passwordInput = screen.getByPlaceholderText('Password');
        fireEvent.submit(passwordInput);

        await waitFor(() => {
            expect(authApi.login).toHaveBeenCalledWith({
                login: 'test@example.com',
                password: 'password123',
            });
        });
    });

    it('shows loading indicator, prevents duplicate submit, and handles error clarity', async () => {
        const mockError = new Error('Request Error') as Error & {
            isAxiosError?: boolean;
            response?: { data: { message: string } };
        };
        mockError.isAxiosError = true;
        mockError.response = { data: { message: 'Invalid credentials' } };
        vi.mocked(authApi.login).mockRejectedValueOnce(mockError);

        renderWithProviders();
        fireEvent.change(screen.getByPlaceholderText('E-mail'), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: 'password123' },
        });

        const button = screen.getByRole('button', { name: /There we go!/i });
        fireEvent.click(button);

        expect(button).toBeDisabled();

        await waitFor(() => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    it('respects remember me persistence and redirects to /chat/@me on success', async () => {
        const setAuthTokenSpy = vi.spyOn(authTokenModule, 'setAuthToken');
        vi.mocked(authApi.login).mockResolvedValueOnce({
            token: 'mock-token',
            username: 'mock-user',
        });

        renderWithProviders();
        fireEvent.change(screen.getByPlaceholderText('E-mail'), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: 'password123' },
        });

        const rememberMeCheckbox = screen.getByRole('checkbox');
        fireEvent.click(rememberMeCheckbox);

        expect(rememberMeCheckbox).not.toBeChecked();

        fireEvent.click(screen.getByRole('button', { name: /There we go!/i }));

        await waitFor(() => {
            expect(setAuthTokenSpy).toHaveBeenCalledWith('mock-token', false);
            expect(screen.getByTestId('location-display')).toHaveTextContent(
                '/chat/@me',
            );
        });
    });

    it('protects authenticated users by redirecting straight to chat context', () => {
        renderWithProviders(['/login'], true);
        expect(screen.getByTestId('location-display')).toHaveTextContent(
            '/chat/@me',
        );
    });

    it('can toggle password visibility', () => {
        renderWithProviders();
        const passwordInput = screen.getByPlaceholderText('Password');

        expect(passwordInput).toHaveAttribute('type', 'password');

        const toggleBtn = screen.getByLabelText('Show password');
        fireEvent.click(toggleBtn);

        expect(passwordInput).toHaveAttribute('type', 'text');
    });
});
