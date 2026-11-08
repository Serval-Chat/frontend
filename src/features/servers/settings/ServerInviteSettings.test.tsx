import { act, fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import * as InviteQueries from '@/api/invites/invites.queries';
import * as VanityQueries from '@/api/vanity/vanity.queries';
import { usePermissions } from '@/hooks/usePermissions';

import { ServerInviteSettings } from './ServerInviteSettings';

vi.mock('@/api/invites/invites.queries', () => ({
    useServerInvites: vi.fn(),
    useCreateInvite: vi.fn(),
    useDeleteInvite: vi.fn(),
}));

vi.mock('@/api/vanity/vanity.queries', () => ({
    useVanityLink: vi.fn(),
    useSetVanityLink: vi.fn(),
    useDeleteVanityLink: vi.fn(),
}));

vi.mock('@/hooks/usePermissions', () => ({
    usePermissions: vi.fn(),
}));

describe('ServerInviteSettings - VanityLinkSection', (): void => {
    const mockSetMutate = vi.fn();
    const mockDeleteMutate = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();

        vi.mocked(InviteQueries.useServerInvites).mockReturnValue({
            data: [],
            isLoading: false,
        } as never);
        vi.mocked(InviteQueries.useCreateInvite).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as never);
        vi.mocked(InviteQueries.useDeleteInvite).mockReturnValue({
            mutate: vi.fn(),
        } as never);

        vi.mocked(VanityQueries.useSetVanityLink).mockReturnValue({
            mutate: mockSetMutate,
            isPending: false,
        } as never);
        vi.mocked(VanityQueries.useDeleteVanityLink).mockReturnValue({
            mutate: mockDeleteMutate,
            isPending: false,
        } as never);
    });

    it('renders nothing for the section while the vanity link is loading', (): void => {
        vi.mocked(usePermissions).mockReturnValue({ isOwner: true } as never);
        vi.mocked(VanityQueries.useVanityLink).mockReturnValue({
            data: undefined,
            isLoading: true,
        } as never);

        render(<ServerInviteSettings serverId="server123" />);

        expect(screen.queryByText('Vanity Link')).not.toBeInTheDocument();
    });

    it('owner with no vanity link sees a form to set one, and no "not set" message', (): void => {
        vi.mocked(usePermissions).mockReturnValue({ isOwner: true } as never);
        vi.mocked(VanityQueries.useVanityLink).mockReturnValue({
            data: { code: null },
            isLoading: false,
        } as never);

        render(<ServerInviteSettings serverId="server123" />);

        expect(screen.getByText('Vanity Link')).toBeInTheDocument();
        expect(
            screen.getByPlaceholderText('e.g. awesome-server'),
        ).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Set' })).toBeInTheDocument();
        expect(
            screen.queryByText('No vanity link has been set for this server.'),
        ).not.toBeInTheDocument();
    });

    it('owner can type a code and save it', (): void => {
        vi.mocked(usePermissions).mockReturnValue({ isOwner: true } as never);
        vi.mocked(VanityQueries.useVanityLink).mockReturnValue({
            data: { code: null },
            isLoading: false,
        } as never);

        render(<ServerInviteSettings serverId="server123" />);

        fireEvent.change(screen.getByPlaceholderText('e.g. awesome-server'), {
            target: { value: 'my-cool-server' },
        });
        fireEvent.click(screen.getByRole('button', { name: 'Set' }));

        expect(mockSetMutate).toHaveBeenCalledWith(
            { code: 'my-cool-server' },
            expect.any(Object),
        );
    });

    it('owner with a vanity link set sees a Change form plus Copy/Remove controls', (): void => {
        vi.mocked(usePermissions).mockReturnValue({ isOwner: true } as never);
        vi.mocked(VanityQueries.useVanityLink).mockReturnValue({
            data: { code: 'myserver' },
            isLoading: false,
        } as never);

        render(<ServerInviteSettings serverId="server123" />);

        expect(
            screen.getByDisplayValue(/\/invite\/myserver$/),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Change' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Copy Link' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Remove' }),
        ).toBeInTheDocument();
    });

    it('owner can remove an existing vanity link', (): void => {
        vi.mocked(usePermissions).mockReturnValue({ isOwner: true } as never);
        vi.mocked(VanityQueries.useVanityLink).mockReturnValue({
            data: { code: 'myserver' },
            isLoading: false,
        } as never);

        render(<ServerInviteSettings serverId="server123" />);

        fireEvent.click(screen.getByRole('button', { name: 'Remove' }));

        expect(mockDeleteMutate).toHaveBeenCalledWith(
            undefined,
            expect.any(Object),
        );
    });

    it('non-owner with no vanity link sees a read-only "not set" message and no form', (): void => {
        vi.mocked(usePermissions).mockReturnValue({
            isOwner: false,
        } as never);
        vi.mocked(VanityQueries.useVanityLink).mockReturnValue({
            data: { code: null },
            isLoading: false,
        } as never);

        render(<ServerInviteSettings serverId="server123" />);

        expect(
            screen.getByText('No vanity link has been set for this server.'),
        ).toBeInTheDocument();
        expect(
            screen.queryByPlaceholderText('e.g. awesome-server'),
        ).not.toBeInTheDocument();
    });

    it('non-owner with a vanity link set sees it read-only, with no Remove or Change controls', (): void => {
        vi.mocked(usePermissions).mockReturnValue({
            isOwner: false,
        } as never);
        vi.mocked(VanityQueries.useVanityLink).mockReturnValue({
            data: { code: 'myserver' },
            isLoading: false,
        } as never);

        render(<ServerInviteSettings serverId="server123" />);

        expect(
            screen.getByDisplayValue(/\/invite\/myserver$/),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: 'Copy Link' }),
        ).toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Remove' }),
        ).not.toBeInTheDocument();
        expect(
            screen.queryByRole('button', { name: 'Change' }),
        ).not.toBeInTheDocument();
    });
});

describe('ServerInviteSettings - copying an invite link', (): void => {
    const writeText = vi.fn();

    beforeEach((): void => {
        vi.clearAllMocks();

        writeText.mockReset();
        writeText.mockResolvedValue(undefined);
        Object.defineProperty(navigator, 'clipboard', {
            configurable: true,
            value: { writeText },
        });

        vi.mocked(InviteQueries.useCreateInvite).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as never);
        vi.mocked(InviteQueries.useDeleteInvite).mockReturnValue({
            mutate: vi.fn(),
        } as never);
        vi.mocked(VanityQueries.useSetVanityLink).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as never);
        vi.mocked(VanityQueries.useDeleteVanityLink).mockReturnValue({
            mutate: vi.fn(),
            isPending: false,
        } as never);
    });

    it('writes the vanity link URL to the clipboard from the in-field glyph', async (): Promise<void> => {
        vi.mocked(usePermissions).mockReturnValue({ isOwner: true } as never);
        vi.mocked(VanityQueries.useVanityLink).mockReturnValue({
            data: { code: 'myserver' },
            isLoading: false,
        } as never);
        vi.mocked(InviteQueries.useServerInvites).mockReturnValue({
            data: [],
            isLoading: false,
        } as never);

        render(<ServerInviteSettings serverId="server123" />);

        fireEvent.click(screen.getByRole('button', { name: 'Copy Link' }));
        await act(async (): Promise<void> => undefined);

        expect(writeText).toHaveBeenCalledWith(
            `${globalThis.location.origin}/invite/myserver`,
        );
    });

    it('writes the invite URL to the clipboard from a table row', async (): Promise<void> => {
        vi.mocked(usePermissions).mockReturnValue({
            isOwner: false,
        } as never);
        vi.mocked(VanityQueries.useVanityLink).mockReturnValue({
            data: { code: null },
            isLoading: false,
        } as never);
        vi.mocked(InviteQueries.useServerInvites).mockReturnValue({
            data: [
                {
                    id: 'inv1',
                    serverId: 'server123',
                    code: 'abc123',
                    createdByUserId: 'u1',
                    uses: 0,
                    createdAt: new Date().toISOString(),
                },
            ],
            isLoading: false,
        } as never);

        render(<ServerInviteSettings serverId="server123" />);

        fireEvent.click(screen.getByTitle('Copy Link'));
        await act(async (): Promise<void> => undefined);

        expect(writeText).toHaveBeenCalledWith(
            `${globalThis.location.origin}/invite/abc123`,
        );
    });
});
