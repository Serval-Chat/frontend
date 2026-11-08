import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { useAdminResetPasswordless } from '@/hooks/admin/useAdminPasswordless';

import { AdminPasswordlessReset } from './AdminPasswordlessReset';

vi.mock('@/hooks/admin/useAdminPasswordless', () => ({
    useAdminResetPasswordless: vi.fn(),
}));

describe('AdminPasswordlessReset', () => {
    const mutate = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(useAdminResetPasswordless).mockReturnValue({
            mutate,
            isPending: false,
        } as never);
        vi.spyOn(globalThis, 'confirm').mockReturnValue(true);
    });

    it('renders nothing for a normal (non-passwordless) account', () => {
        const { container } = render(
            <AdminPasswordlessReset isPasswordless={false} userId="user-1" />,
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('shows the reset button for a passwordless account', () => {
        render(<AdminPasswordlessReset isPasswordless userId="user-1" />);
        expect(
            screen.getByRole('button', { name: /Reset Account/i }),
        ).toBeInTheDocument();
    });

    it('does nothing if the confirm dialog is dismissed', () => {
        vi.spyOn(globalThis, 'confirm').mockReturnValue(false);
        render(<AdminPasswordlessReset isPasswordless userId="user-1" />);

        fireEvent.click(screen.getByRole('button', { name: /Reset Account/i }));

        expect(mutate).not.toHaveBeenCalled();
    });

    it('calls the mutation with the userId after confirming', () => {
        render(<AdminPasswordlessReset isPasswordless userId="user-1" />);

        fireEvent.click(screen.getByRole('button', { name: /Reset Account/i }));

        expect(mutate).toHaveBeenCalledWith(
            'user-1',
            expect.objectContaining({ onSuccess: expect.any(Function) }),
        );
    });

    it('shows the returned temporary password once the mutation succeeds', () => {
        mutate.mockImplementation((_userId, { onSuccess }) => {
            onSuccess({
                message: 'ok',
                temporaryPassword: 'TEMP-XYZ-9',
            });
        });

        render(<AdminPasswordlessReset isPasswordless userId="user-1" />);
        fireEvent.click(screen.getByRole('button', { name: /Reset Account/i }));

        expect(screen.getByText('TEMP-XYZ-9')).toBeInTheDocument();
    });
});
