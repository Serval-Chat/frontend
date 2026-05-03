import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
    type RenderResult,
    fireEvent,
    render,
    screen,
} from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { BlockUserModal } from '@/ui/components/profile/modals/BlockUserModal';
import type { BlockUserModalProps } from '@/ui/components/profile/modals/BlockUserModal';

const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
});

const renderComponent = (
    props: Partial<BlockUserModalProps> = {},
): RenderResult => {
    const defaultProps: BlockUserModalProps = {
        isOpen: true,
        profiles: [
            {
                id: 'profile-1',
                name: 'Default',
                flags: 4095,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
            {
                id: 'profile-2',
                name: 'Strict Mute',
                flags: 8192,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
            },
        ],
        username: 'TestUser',
        onClose: vi.fn(),
        onConfirm: vi.fn(),
    };

    const allProps = { ...defaultProps, ...props };
    return render(
        <QueryClientProvider client={queryClient}>
            <BlockUserModal
                isOpen={allProps.isOpen}
                profiles={allProps.profiles}
                userAvatar={allProps.userAvatar}
                username={allProps.username}
                onClose={allProps.onClose}
                onConfirm={allProps.onConfirm}
            />
        </QueryClientProvider>,
    );
};

describe('BlockUserModal', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should not render when isOpen is false', () => {
        renderComponent({ isOpen: false });
        expect(screen.queryByText('Block User')).not.toBeInTheDocument();
    });

    it('renders the modal with provided username and profiles', () => {
        renderComponent();
        expect(
            screen.getByRole('heading', { name: /Block TestUser/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Block User/i }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('button', { name: /Cancel/i }),
        ).toBeInTheDocument();

        const select = screen.getByRole('combobox');
        expect(select).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: 'Default' }),
        ).toBeInTheDocument();
        expect(
            screen.getByRole('option', { name: 'Strict Mute' }),
        ).toBeInTheDocument();
    });

    it('selects the first profile by default if none is selected', () => {
        renderComponent();
        const select = screen.getByRole('combobox') as HTMLSelectElement;
        expect(select.value).toBe('profile-1');
    });

    it('invokes onClose when Cancel is clicked', () => {
        const onCloseMock = vi.fn();
        renderComponent({ onClose: onCloseMock });

        fireEvent.click(screen.getByRole('button', { name: /Cancel/i }));
        expect(onCloseMock).toHaveBeenCalledOnce();
    });

    it('invokes onConfirm with the selected profileId and closes modal', () => {
        const onConfirmMock = vi.fn();
        const onCloseMock = vi.fn();
        renderComponent({ onConfirm: onConfirmMock, onClose: onCloseMock });

        const select = screen.getByRole('combobox');
        fireEvent.change(select, { target: { value: 'profile-2' } });

        fireEvent.click(screen.getByRole('button', { name: /Block User/i }));

        expect(onConfirmMock).toHaveBeenCalledWith('profile-2');
        expect(onCloseMock).toHaveBeenCalledOnce();
    });

    it('disables the confirmation button if no profiles are provided/valid', () => {
        renderComponent({ profiles: [] });
        const blockButton = screen.getByRole('button', {
            name: /Block User/i,
        }) as HTMLButtonElement;
        expect(blockButton.disabled).toBe(true);
    });
});
