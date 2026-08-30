import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { authApi } from '@/api/auth/auth.api';
import { useLoginWithPasskey } from '@/hooks/useLoginWithPasskey';
import { useLoginWithRecoveryKey } from '@/hooks/useLoginWithRecoveryKey';
import * as authTokenModule from '@/utils/authToken';
import { canUsePasskeys } from '@/utils/webauthn';

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

vi.mock('@/utils/webauthn', () => ({
    canUsePasskeys: vi.fn(),
}));

vi.mock('@/hooks/useLoginWithPasskey', () => ({
    useLoginWithPasskey: vi.fn(),
}));

vi.mock('@/hooks/useLoginWithRecoveryKey', () => ({
    useLoginWithRecoveryKey: vi.fn(),
}));

const LocationDisplay = (): React.ReactElement => {
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

describe('Login Page Integration', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();
        localStorage.clear();
        sessionStorage.clear();
        vi.mocked(canUsePasskeys).mockReturnValue(false);
        vi.mocked(useLoginWithPasskey).mockReturnValue({
            isLoading: false,
            error: null,
            banInfo: null,
            resetBan: vi.fn(),
            loginWithPasskey: vi.fn(),
        });
        vi.mocked(useLoginWithRecoveryKey).mockReturnValue({
            login: '',
            setLogin: vi.fn(),
            recoveryKey: '',
            setRecoveryKey: vi.fn(),
            turnstileToken: '',
            setTurnstileToken: vi.fn(),
            isLoading: false,
            error: null,
            banInfo: null,
            resetBan: vi.fn(),
            isFormValid: false,
            handleSubmit: vi.fn(),
        });
    });

    it('requires both email and password to enable the submit button', async (): Promise<void> => {
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
        // Turnstile mock fires onSuccess asynchronously, so wait
        await waitFor((): void => {
            expect(button).not.toBeDisabled();
        });
    });

    it('submits on enter key if fields are valid', async (): Promise<void> => {
        vi.mocked(authApi.login).mockResolvedValueOnce({
            token: 'mock-token',
            username: 'mock-user',
        });
        renderWithProviders();

        fireEvent.change(screen.getByPlaceholderText('E-mail'), {
            target: { value: 'testuser@example.com' },
        });
        fireEvent.change(screen.getByPlaceholderText('Password'), {
            target: { value: 'password123' },
        });

        const passwordInput = screen.getByPlaceholderText('Password');
        fireEvent.submit(passwordInput);

        await waitFor((): void => {
            expect(authApi.login).toHaveBeenCalledWith({
                login: 'testuser@example.com',
                password: 'password123',
                cfTurnstileResponse: 'mock-turnstile-token',
            });
        });
    });

    it('shows loading indicator, prevents duplicate submit, and handles error clarity', async (): Promise<void> => {
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
        await waitFor(() => expect(button).not.toBeDisabled());
        fireEvent.click(button);

        expect(button).toBeDisabled();

        await waitFor((): void => {
            expect(screen.getByText('Invalid credentials')).toBeInTheDocument();
        });
    });

    it('respects remember me persistence and redirects to /chat/@me on success', async (): Promise<void> => {
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

        await waitFor((): void => {
            expect(setAuthTokenSpy).toHaveBeenCalledWith('mock-token', false);
            expect(screen.getByTestId('location-display')).toHaveTextContent(
                '/chat/@me',
            );
        });
    });

    it('protects authenticated users by redirecting straight to chat context', (): void => {
        renderWithProviders(['/login'], true);
        expect(screen.getByTestId('location-display')).toHaveTextContent(
            '/chat/@me',
        );
    });

    it('can toggle password visibility', (): void => {
        renderWithProviders();
        const passwordInput = screen.getByPlaceholderText('Password');

        expect(passwordInput).toHaveAttribute('type', 'password');

        const toggleBtn = screen.getByLabelText('Show password');
        fireEvent.click(toggleBtn);

        expect(passwordInput).toHaveAttribute('type', 'text');
    });

    it('shows the passkey button only when the platform supports it', (): void => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        renderWithProviders();
        expect(
            screen.getByRole('button', { name: /Sign in with a passkey/i }),
        ).toBeInTheDocument();
    });

    it('hides the passkey button when unsupported (e.g. inside Tauri)', (): void => {
        vi.mocked(canUsePasskeys).mockReturnValue(false);
        renderWithProviders();
        expect(
            screen.queryByRole('button', { name: /Sign in with a passkey/i }),
        ).not.toBeInTheDocument();
    });

    it('clicking the passkey button delegates to loginWithPasskey', (): void => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        const loginWithPasskey = vi.fn();
        vi.mocked(useLoginWithPasskey).mockReturnValue({
            isLoading: false,
            error: null,
            banInfo: null,
            resetBan: vi.fn(),
            loginWithPasskey,
        });

        renderWithProviders();
        fireEvent.click(
            screen.getByRole('button', { name: /Sign in with a passkey/i }),
        );

        expect(loginWithPasskey).toHaveBeenCalled();
    });

    it('renders BannedScreen when the passkey hook reports a ban', (): void => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        vi.mocked(useLoginWithPasskey).mockReturnValue({
            isLoading: false,
            error: null,
            banInfo: { reason: 'Spamming' },
            resetBan: vi.fn(),
            loginWithPasskey: vi.fn(),
        });

        renderWithProviders();

        expect(screen.getByText('Spamming')).toBeInTheDocument();
    });

    it('shows the recovery-key link only when passkeys are supported', (): void => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        renderWithProviders();
        expect(screen.getByText(/Use a recovery key/i)).toBeInTheDocument();
    });

    it('hides the recovery-key link when passkeys are unsupported', (): void => {
        vi.mocked(canUsePasskeys).mockReturnValue(false);
        renderWithProviders();
        expect(
            screen.queryByText(/Use a recovery key/i),
        ).not.toBeInTheDocument();
    });

    it('switches to the recovery-key form and back', (): void => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        renderWithProviders();

        fireEvent.click(screen.getByText(/Use a recovery key/i));

        expect(
            screen.getByPlaceholderText('Recovery key (XXXX-XXXX)'),
        ).toBeInTheDocument();
        expect(
            screen.queryByPlaceholderText('Password'),
        ).not.toBeInTheDocument();

        fireEvent.click(screen.getByText(/Back to sign in/i));

        expect(screen.getByPlaceholderText('Password')).toBeInTheDocument();
    });

    it('submitting the recovery-key form calls its handleSubmit', (): void => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        const handleSubmit = vi.fn();
        vi.mocked(useLoginWithRecoveryKey).mockReturnValue({
            login: 'user@example.com',
            setLogin: vi.fn(),
            recoveryKey: 'ABCD-1234',
            setRecoveryKey: vi.fn(),
            turnstileToken: 'tok',
            setTurnstileToken: vi.fn(),
            isLoading: false,
            error: null,
            banInfo: null,
            resetBan: vi.fn(),
            isFormValid: true,
            handleSubmit,
        });

        renderWithProviders();
        fireEvent.click(screen.getByText(/Use a recovery key/i));
        fireEvent.click(
            screen.getByRole('button', { name: /Use recovery key/i }),
        );

        expect(handleSubmit).toHaveBeenCalled();
    });

    it('renders BannedScreen when the recovery-key hook reports a ban', (): void => {
        vi.mocked(canUsePasskeys).mockReturnValue(true);
        vi.mocked(useLoginWithRecoveryKey).mockReturnValue({
            login: '',
            setLogin: vi.fn(),
            recoveryKey: '',
            setRecoveryKey: vi.fn(),
            turnstileToken: '',
            setTurnstileToken: vi.fn(),
            isLoading: false,
            error: null,
            banInfo: { reason: 'Recovery abuse' },
            resetBan: vi.fn(),
            isFormValid: false,
            handleSubmit: vi.fn(),
        });

        renderWithProviders();

        expect(screen.getByText('Recovery abuse')).toBeInTheDocument();
    });
});
