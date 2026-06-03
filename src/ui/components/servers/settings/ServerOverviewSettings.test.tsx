import { fireEvent, render, screen } from '@testing-library/react';
import type * as ReactRouterDom from 'react-router-dom';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as ServerQueries from '@/api/servers/servers.queries';
import * as UserQueries from '@/api/users/users.queries';

import { ServerOverviewSettings } from './ServerOverviewSettings';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
    const actual =
        await vi.importActual<typeof ReactRouterDom>('react-router-dom');
    return {
        ...actual,
        useNavigate: () => mockNavigate,
    };
});

vi.mock('@/api/servers/servers.queries', () => ({
    useDeleteServer: vi.fn(),
    useMembers: vi.fn(),
    useRequestServerVerification: vi.fn(),
    useServerDiscoveryStatus: vi.fn(),
    useServerDetails: vi.fn(),
    useTransferOwnership: vi.fn(),
    useUpdateServer: vi.fn(),
    useUpdateServerBanner: vi.fn(),
    useUpdateServerIcon: vi.fn(),
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn(),
}));

describe('ServerOverviewSettings', (): void => {
    beforeEach((): void => {
        vi.clearAllMocks();

        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { href: 'http://localhost/' },
            writable: true,
        });
        mockNavigate.mockReset();

        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: {
                id: 'server123',
                icon: 'icon.png',
                name: 'Test Server',
                ownerId: 'user123',
                tags: [],
            },
            isLoading: false,
        } as never);

        vi.mocked(ServerQueries.useMembers).mockReturnValue({
            data: [],
        } as never);

        vi.mocked(UserQueries.useMe).mockReturnValue({
            data: { id: 'user123' },
        } as never);

        vi.mocked(ServerQueries.useUpdateServer).mockReturnValue({
            isPending: false,
            mutate: vi.fn(),
        } as never);
        vi.mocked(ServerQueries.useDeleteServer).mockReturnValue({
            isPending: false,
            mutate: vi.fn(),
        } as never);
        vi.mocked(ServerQueries.useUpdateServerIcon).mockReturnValue({
            isPending: false,
            mutate: vi.fn(),
        } as never);
        vi.mocked(ServerQueries.useUpdateServerBanner).mockReturnValue({
            isPending: false,
            mutate: vi.fn(),
        } as never);
        vi.mocked(ServerQueries.useTransferOwnership).mockReturnValue({
            isPending: false,
            mutate: vi.fn(),
        } as never);
        vi.mocked(ServerQueries.useRequestServerVerification).mockReturnValue({
            isPending: false,
            mutate: vi.fn(),
        } as never);
        vi.mocked(ServerQueries.useServerDiscoveryStatus).mockReturnValue({
            data: {
                eligible: true,
                blockers: [],
                hasValidVanityInvite: true,
                vanityInviteCode: 'test-server',
            },
        } as never);
    });

    it('redirects to /chat/@me after successful server deletion', (): void => {
        const mockDeleteServer = vi.fn((_serverId, options): void => {
            options.onSuccess();
        });
        vi.mocked(ServerQueries.useDeleteServer).mockReturnValue({
            isPending: false,
            mutate: mockDeleteServer,
        } as never);

        render(<ServerOverviewSettings serverId="server123" />);

        const dangerZoneDeleteButton = screen.getAllByRole('button', {
            name: /Delete Server/i,
        })[0];
        fireEvent.click(dangerZoneDeleteButton);

        const confirmInput = screen.getByLabelText(/Enter Server Name/i);
        fireEvent.change(confirmInput, { target: { value: 'Test Server' } });

        const confirmDeleteButton = screen
            .getAllByRole('button', {
                name: /Delete Server/i,
            })
            .slice(-1)[0];
        fireEvent.click(confirmDeleteButton);

        expect(mockDeleteServer).toHaveBeenCalledWith(
            'server123',
            expect.any(Object),
        );
        expect(mockNavigate).toHaveBeenCalledWith('/chat/@me');
    });

    it('shows discovery blockers when opt-in is enabled before eligibility is met', (): void => {
        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: {
                id: 'server123',
                icon: 'icon.png',
                name: 'Test Server',
                ownerId: 'user123',
                description: '',
                discoveryEnabled: false,
                tags: [],
            },
            isLoading: false,
        } as never);
        vi.mocked(ServerQueries.useServerDiscoveryStatus).mockReturnValue({
            data: {
                eligible: false,
                blockers: [
                    'Server must be verified.',
                    'Server needs a vanity invite with unlimited uses and no expiry.',
                ],
                hasValidVanityInvite: false,
            },
        } as never);

        render(<ServerOverviewSettings serverId="server123" />);

        fireEvent.click(
            screen.getByRole('checkbox', {
                name: /Show in Server Discovery/i,
            }),
        );

        expect(screen.getByText('Discovery blockers')).toBeInTheDocument();
        expect(
            screen.getByText('Server must be verified.'),
        ).toBeInTheDocument();
        expect(
            screen.getByText(
                'Server needs a vanity invite with unlimited uses and no expiry.',
            ),
        ).toBeInTheDocument();
    });

    it('uses unsaved description and tags when showing discovery blockers', (): void => {
        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: {
                id: 'server123',
                icon: 'icon.png',
                name: 'Test Server',
                ownerId: 'user123',
                description: '',
                discoveryEnabled: false,
                tags: [],
            },
            isLoading: false,
        } as never);
        vi.mocked(ServerQueries.useServerDiscoveryStatus).mockReturnValue({
            data: {
                eligible: false,
                blockers: [
                    'Server must opt in to discovery.',
                    'Server must have a description.',
                    'Server must have at least one tag.',
                    'Server must be verified.',
                ],
                hasValidVanityInvite: true,
            },
        } as never);

        render(<ServerOverviewSettings serverId="server123" />);

        fireEvent.change(screen.getByLabelText(/Server Description/i), {
            target: { value: 'A freshly typed description.' },
        });
        const tagInput = screen.getByLabelText(/Server Tags/i);
        fireEvent.change(tagInput, {
            target: { value: 'Gaming' },
        });
        fireEvent.keyDown(tagInput, { key: 'Enter' });
        fireEvent.click(
            screen.getByRole('checkbox', {
                name: /Show in Server Discovery/i,
            }),
        );

        expect(
            screen.queryByText('Server must opt in to discovery.'),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText('Server must have a description.'),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByText('Server must have at least one tag.'),
        ).not.toBeInTheDocument();
        expect(
            screen.getByText('Server must be verified.'),
        ).toBeInTheDocument();
    });
});
