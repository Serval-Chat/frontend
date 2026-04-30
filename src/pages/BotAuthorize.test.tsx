import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    type RenderResult,
    fireEvent,
    render,
    screen,
    waitFor,
} from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as serversQueries from '@/api/servers/servers.queries';
import * as usersQueries from '@/api/users/users.queries';
import * as botsHooks from '@/hooks/developer/useBots';

import { BotAuthorize } from './BotAuthorize';

vi.mock('@/ui/components/layout/DefaultBackground', () => ({
    DefaultBackground: () => null,
}));

vi.mock('@/ui/components/common/Toast', () => ({
    useToast: () => ({ showToast: mockShowToast }),
}));

vi.mock('@/hooks/developer/useBots', () => ({
    usePublicBotInfo: vi.fn(),
    useAuthorizeBot: vi.fn(),
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn(),
}));

vi.mock('@/api/servers/servers.queries', () => ({
    useServers: vi.fn(),
}));

const mockShowToast = vi.fn();

const mockBotInfo = {
    clientId: 'abc123',
    username: 'testbot',
    displayName: 'Test Bot',
    bio: 'A helpful bot',
    botPermissions: {
        readMessages: true,
        sendMessages: true,
        manageMessages: false,
        readUsers: false,
        joinServers: true,
        manageServer: false,
        manageChannels: false,
        manageMembers: false,
        readReactions: false,
        addReactions: false,
    },
    serverCount: 3,
};

const mockServers = [
    { _id: 'srv1', name: 'My Server' },
    { _id: 'srv2', name: 'Another Server' },
];

const mockUser = { _id: 'u1', username: 'testuser' };

function renderPage(search = '?client_id=abc123'): RenderResult {
    const queryClient = new QueryClient({
        defaultOptions: {
            queries: { retry: false },
            mutations: { retry: false },
        },
    });
    return render(
        <QueryClientProvider client={queryClient}>
            <MemoryRouter initialEntries={[`/authorize${search}`]}>
                <Routes>
                    <Route element={<BotAuthorize />} path="/authorize" />
                    <Route
                        element={<div data-testid="server-page" />}
                        path="/chat/@server/:serverId"
                    />
                </Routes>
            </MemoryRouter>
        </QueryClientProvider>,
    );
}

describe('BotAuthorize', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(usersQueries.useMe).mockReturnValue({
            data: mockUser,
        } as ReturnType<typeof usersQueries.useMe>);
        vi.mocked(serversQueries.useServers).mockReturnValue({
            data: mockServers,
            isLoading: false,
        } as ReturnType<typeof serversQueries.useServers>);
        vi.mocked(botsHooks.useAuthorizeBot).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as any as ReturnType<typeof botsHooks.useAuthorizeBot>);
    });

    it('shows InvalidBot when no client_id in URL', () => {
        vi.mocked(botsHooks.usePublicBotInfo).mockReturnValue({
            isLoading: false,
            isError: true,
            data: undefined,
        } as ReturnType<typeof botsHooks.usePublicBotInfo>);
        renderPage('');
        expect(screen.getByText('Bot Not Found')).toBeInTheDocument();
    });

    it('shows InvalidBot when bot fetch returns an error', () => {
        vi.mocked(botsHooks.usePublicBotInfo).mockReturnValue({
            isLoading: false,
            isError: true,
            data: undefined,
        } as ReturnType<typeof botsHooks.usePublicBotInfo>);
        renderPage();
        expect(screen.getByText('Bot Not Found')).toBeInTheDocument();
    });

    it('renders bot name and server count when loaded', () => {
        vi.mocked(botsHooks.usePublicBotInfo).mockReturnValue({
            isLoading: false,
            isError: false,
            data: mockBotInfo,
        } as ReturnType<typeof botsHooks.usePublicBotInfo>);
        renderPage();
        expect(screen.getByText('Test Bot')).toBeInTheDocument();
        expect(screen.getByText(/In 3 servers/)).toBeInTheDocument();
    });

    it('renders requested permissions as chips', () => {
        vi.mocked(botsHooks.usePublicBotInfo).mockReturnValue({
            isLoading: false,
            isError: false,
            data: mockBotInfo,
        } as ReturnType<typeof botsHooks.usePublicBotInfo>);
        renderPage();
        expect(screen.getByText('Read messages')).toBeInTheDocument();
        expect(screen.getByText('Send messages')).toBeInTheDocument();
    });

    it('shows bot bio when present', () => {
        vi.mocked(botsHooks.usePublicBotInfo).mockReturnValue({
            isLoading: false,
            isError: false,
            data: mockBotInfo,
        } as ReturnType<typeof botsHooks.usePublicBotInfo>);
        renderPage();
        expect(screen.getByText('A helpful bot')).toBeInTheDocument();
    });

    it('shows "Authorizing as" with current username', () => {
        vi.mocked(botsHooks.usePublicBotInfo).mockReturnValue({
            isLoading: false,
            isError: false,
            data: mockBotInfo,
        } as ReturnType<typeof botsHooks.usePublicBotInfo>);
        renderPage();
        expect(screen.getByText(/@testuser/)).toBeInTheDocument();
    });

    it('Authorize button is disabled until a server is selected', () => {
        vi.mocked(botsHooks.usePublicBotInfo).mockReturnValue({
            isLoading: false,
            isError: false,
            data: mockBotInfo,
        } as ReturnType<typeof botsHooks.usePublicBotInfo>);
        renderPage();
        expect(
            screen.getByRole('button', { name: /Authorize/i }),
        ).toBeDisabled();
    });

    it('Authorize button enables after selecting a server from dropdown', async () => {
        vi.mocked(botsHooks.usePublicBotInfo).mockReturnValue({
            isLoading: false,
            isError: false,
            data: mockBotInfo,
        } as ReturnType<typeof botsHooks.usePublicBotInfo>);
        renderPage();

        fireEvent.click(screen.getByText(/Select a server/i));
        fireEvent.click(screen.getByText('My Server'));

        expect(
            screen.getByRole('button', { name: /Authorize/i }),
        ).not.toBeDisabled();
    });

    it('shows SuccessCard with bot and server name after authorization', async () => {
        const mockMutate = vi.fn().mockImplementation(
            (
                _vars: unknown,
                callbacks: {
                    onSuccess: (v: {
                        serverName: string;
                        serverId: string;
                    }) => void;
                },
            ) => {
                callbacks.onSuccess({
                    serverName: 'My Server',
                    serverId: 'srv1',
                });
            },
        );
        vi.mocked(botsHooks.usePublicBotInfo).mockReturnValue({
            isLoading: false,
            isError: false,
            data: mockBotInfo,
        } as ReturnType<typeof botsHooks.usePublicBotInfo>);
        vi.mocked(botsHooks.useAuthorizeBot).mockReturnValue({
            mutate: mockMutate,
            isPending: false,
        } as any as ReturnType<typeof botsHooks.useAuthorizeBot>);
        renderPage();

        fireEvent.click(screen.getByText(/Select a server/i));
        fireEvent.click(screen.getByText('My Server'));
        fireEvent.click(screen.getByRole('button', { name: /Authorize/i }));

        await waitFor(() => {
            expect(screen.getByText('Test Bot added!')).toBeInTheDocument();
        });
        expect(screen.getByText(/now a member of/)).toBeInTheDocument();
    });

    it('shows error toast when authorization fails', async () => {
        const mockMutate = vi.fn().mockImplementation(
            (
                _vars: unknown,
                callbacks: {
                    onError: (e: Error) => void;
                },
            ) => {
                callbacks.onError(new Error('Bot is banned from this server'));
            },
        );
        vi.mocked(botsHooks.usePublicBotInfo).mockReturnValue({
            isLoading: false,
            isError: false,
            data: mockBotInfo,
        } as ReturnType<typeof botsHooks.usePublicBotInfo>);
        vi.mocked(botsHooks.useAuthorizeBot).mockReturnValue({
            mutate: mockMutate,
            isPending: false,
        } as any as ReturnType<typeof botsHooks.useAuthorizeBot>);
        renderPage();

        fireEvent.click(screen.getByText(/Select a server/i));
        fireEvent.click(screen.getByText('My Server'));
        fireEvent.click(screen.getByRole('button', { name: /Authorize/i }));

        await waitFor(() => {
            expect(mockShowToast).toHaveBeenCalledWith(
                'Bot is banned from this server',
                'error',
            );
        });
    });
});
