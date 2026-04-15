import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as ServerQueries from '@/api/servers/servers.queries';
import * as UserQueries from '@/api/users/users.queries';

import { ServerOverviewSettings } from './ServerOverviewSettings';

vi.mock('@/api/servers/servers.queries', () => ({
    useDeleteServer: vi.fn(),
    useMembers: vi.fn(),
    useRequestServerVerification: vi.fn(),
    useServerDetails: vi.fn(),
    useTransferOwnership: vi.fn(),
    useUpdateServer: vi.fn(),
    useUpdateServerBanner: vi.fn(),
    useUpdateServerIcon: vi.fn(),
}));

vi.mock('@/api/users/users.queries', () => ({
    useMe: vi.fn(),
}));

describe('ServerOverviewSettings', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        Object.defineProperty(window, 'location', {
            configurable: true,
            value: { href: 'http://localhost/' },
            writable: true,
        });

        vi.mocked(ServerQueries.useServerDetails).mockReturnValue({
            data: {
                _id: 'server123',
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
            data: { _id: 'user123' },
        } as never);

        vi.mocked(ServerQueries.useUpdateServer).mockReturnValue({
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
    });

    it('redirects to /chat/@me after successful server deletion', () => {
        const mockDeleteServer = vi.fn((_id, options) => {
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
        expect(window.location.href).toBe('/chat/@me');
    });
});
