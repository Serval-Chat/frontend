import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authApi } from '@/api/auth/auth.api';
import * as authTokenModule from '@/utils/authToken';

import { Register } from './Register';

vi.mock('@/api/auth/auth.api', () => ({
    authApi: {
        register: vi.fn(),
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

const renderWithProviders = (): ReturnType<typeof render> => {
    const queryClient = new QueryClient({
        defaultOptions: { queries: { retry: false } },
    });

    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={['/register']}>
                <Routes>
                    <Route element={<Register />} path="/register" />
                    <Route element={<LocationDisplay />} path="/chat/@me" />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
};

describe('Register Page Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('disables submit until all fields are filled, validating dynamically', async () => {
        renderWithProviders();
        const button = screen.getByRole('button', { name: /Register/i });
        expect(button).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('E-mail'), {
            target: { value: 'user' },
        });
        expect(screen.getByText('Invalid email')).toBeInTheDocument();
        expect(button).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('E-mail'), {
            target: { value: 'user@test.com' },
        });
        fireEvent.change(
            screen.getByPlaceholderText('Username (display name)'),
            { target: { value: 'cat123' } },
        );
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: 'password123' },
        });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
            target: { value: 'password1234' },
        });
        fireEvent.change(screen.getByPlaceholderText('Invite Token'), {
            target: { value: 'token123' },
        });

        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
        expect(button).toBeDisabled();

        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
            target: { value: 'password123' },
        });

        await waitFor(() => {
            expect(button).not.toBeDisabled();
        });
    });

    it('can toggle password visibility for both password inputs', () => {
        renderWithProviders();
        const passwordInput = screen.getByPlaceholderText('Password');
        const confirmPasswordInput =
            screen.getByPlaceholderText('Confirm Password');

        expect(passwordInput).toHaveAttribute('type', 'password');
        expect(confirmPasswordInput).toHaveAttribute('type', 'password');

        const toggleBtns = screen.getAllByLabelText('Show password');
        expect(toggleBtns).toHaveLength(2);

        fireEvent.click(toggleBtns[0]);
        expect(passwordInput).toHaveAttribute('type', 'text');
        expect(confirmPasswordInput).toHaveAttribute('type', 'password');

        fireEvent.click(toggleBtns[1]);
        expect(passwordInput).toHaveAttribute('type', 'text');
        expect(confirmPasswordInput).toHaveAttribute('type', 'text');
    });

    it('handles successful registration, clears data, and redirects to /chat/@me', async () => {
        const setAuthTokenSpy = vi.spyOn(authTokenModule, 'setAuthToken');
        vi.mocked(authApi.register).mockResolvedValueOnce({
            token: 'mock-token',
        });

        renderWithProviders();
        fireEvent.change(screen.getByPlaceholderText('E-mail'), {
            target: { value: 'test@example.com' },
        });
        fireEvent.change(
            screen.getByPlaceholderText('Username (display name)'),
            { target: { value: 'cat123' } },
        );
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: 'password123' },
        });
        fireEvent.change(screen.getByPlaceholderText('Confirm Password'), {
            target: { value: 'password123' },
        });
        fireEvent.change(screen.getByPlaceholderText('Invite Token'), {
            target: { value: 'token123' },
        });

        const button = screen.getByRole('button', { name: /Register/i });
        fireEvent.click(button);

        expect(button).toBeDisabled();

        await waitFor(() => {
            expect(authApi.register).toHaveBeenCalledWith({
                login: 'test@example.com',
                username: 'cat123',
                password: 'password123',
                invite: 'token123',
            });
            expect(setAuthTokenSpy).toHaveBeenCalledWith('mock-token');
            expect(screen.getByTestId('location-display')).toHaveTextContent(
                '/chat/@me',
            );
        });
    });
});
